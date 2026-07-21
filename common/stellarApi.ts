import fs from "fs";
import {
  Keypair,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

// ============================================================================
// Shared helpers for the Bitbond Token Tool public Stellar API (`/api/v1`).
//
// The API is non-custodial: build endpoints return an *unsigned* transaction
// (base64 XDR) plus its final hash, you sign locally with your own key, and you
// POST the signed XDR back to `/submit`. No key material ever leaves this
// machine. Every state-changing operation follows the same four steps:
//
//   1. Build  - POST a `*/build` endpoint -> { xdr, hash, txKind, feeStroops }
//   2. Sign   - sign the XDR locally with the source account's secret key
//   3. Submit - POST /submit with the signed XDR -> 202 { status: "pending" }
//   4. Poll   - GET /status/{hash} until it resolves to success | failed
// ============================================================================

// The Token Tool host. The Stellar app is served under the `/stellar` basePath.
// Override the host with the TOKEN_TOOL_HOST env var (e.g. a PR preview URL).
const HOST = process.env.TOKEN_TOOL_HOST ?? "https://tokentool.bitbond.com";
export const BASE_URL = `${HOST}/stellar/api/v1`;

// Every request names the network. `mainnet` is the Stellar public network,
// `testnet` is the Stellar test network.
export type ChainId = "mainnet" | "testnet";

// Transactions are routed by kind: Horizon for Classic, Soroban RPC otherwise.
export type TxKind = "classic" | "soroban";

// Shape returned by every `*/build` endpoint.
export interface BuildResult {
  // Base64-encoded unsigned transaction envelope.
  xdr: string;
  // 64-char hex pre-signature hash. Stellar hashes the transaction body without
  // signatures, so this is already the final transaction hash - persist it as an
  // in-flight marker before you sign any non-idempotent operation.
  hash: string;
  txKind: TxKind;
  // Service fee embedded in the transaction, in stroops ("0" for zero-fee ops).
  feeStroops: string;
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ title: string; status: number }> };

// Error carrying the HTTP status so callers can decide retryability: a 503 is
// transient (retry with backoff); any 4xx is permanent for the request as sent.
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  // Error responses from the infra layer (proxy/CDN/gateway rate-limit 429,
  // upstream-unreachable 503/502) are not JSON envelopes, so res.json() would
  // throw and lose the status. Fall back to the HTTP status when parsing fails
  // so callers can still classify retryability from ApiError.status.
  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(res.status, `Request failed with HTTP ${res.status}`);
  }
  if (!body.success) {
    // Guard refusals and validation failures come back as errors[0].title - a
    // human-readable sentence, not a stable error code. Branch on `status`.
    const first = body.errors?.[0];
    throw new ApiError(
      first?.status ?? res.status,
      first?.title ?? `Request failed with HTTP ${res.status}`
    );
  }
  return body.data;
}

/** GET a read/query endpoint and return its `data` payload. */
export async function apiGet<T>(
  path: string,
  query: Record<string, string>
): Promise<T> {
  const url = `${BASE_URL}${path}?${new URLSearchParams(query).toString()}`;
  return unwrap<T>(await fetch(url));
}

/** POST a JSON body to an endpoint and return its `data` payload. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}

/** Sign an unsigned XDR locally with the source account's secret key (S...). */
export function signXdr(
  xdr: string,
  secretKey: string,
  chainId: ChainId
): string {
  const passphrase = chainId === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  const tx = TransactionBuilder.fromXDR(xdr, passphrase);
  tx.sign(Keypair.fromSecret(secretKey));
  return tx.toXDR();
}

/** Read a Stellar secret key (S...) from a file and validate it. */
export function loadSecretKey(path: string): string {
  const secret = fs.readFileSync(path, "utf-8").trim();
  // Throws if the seed is malformed - fail early rather than at submit time.
  Keypair.fromSecret(secret);
  return secret;
}

/**
 * Token Tool manage-token page for a Classic asset (the app's "trustline invite"
 * link). A holder opens this, connects their wallet, and adds the trustline
 * themselves - the only way to trust an asset for an account whose key you do
 * not hold. `networkName` preselects the right network on the page.
 */
export function manageAssetUrl(
  chainId: ChainId,
  code: string,
  issuer: string
): string {
  return `${HOST}/stellar/manage-token/${code}-${issuer}?networkName=${chainId}`;
}

/** POST a signed XDR to /submit. Returns 202 immediately with status pending. */
export async function submit(
  chainId: ChainId,
  signedXdr: string
): Promise<{ hash: string; txKind: TxKind; status: "pending" }> {
  return apiPost("/submit", { chainId, xdr: signedXdr });
}

/** GET /status/{hash} once. */
export async function getStatus(
  chainId: ChainId,
  hash: string,
  txKind?: TxKind
): Promise<"success" | "failed" | "pending"> {
  const query: Record<string, string> = { chainId };
  if (txKind) query.txKind = txKind;
  const data = await apiGet<{ status: "success" | "failed" | "pending" }>(
    `/status/${hash}`,
    query
  );
  return data.status;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll GET /status/{hash} until it resolves. Per the submit/poll contract, only
 * a `failed` outcome permits re-signing; `pending` means "check the explorer, do
 * not re-sign." If polling times out while still pending, we surface that as a
 * (non-failed) terminal state - never re-sign on it.
 */
export async function pollStatus(
  chainId: ChainId,
  hash: string,
  txKind: TxKind,
  { intervalMs = 3000, timeoutMs = 120000 } = {}
): Promise<"success" | "failed" | "pending"> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const status = await getStatus(chainId, hash, txKind);
    if (status !== "pending") return status;
    if (Date.now() >= deadline) {
      console.warn(
        `Still pending after ${timeoutMs}ms. Do NOT re-sign - check the explorer for ${hash}.`
      );
      return "pending";
    }
    await sleep(intervalMs);
  }
}

/**
 * The full lifecycle for one state-changing operation: build -> sign -> submit
 * -> poll. Returns only once the transaction has confirmed `success`. Throws on
 * a `failed` outcome AND on an unresolved `pending` (poll timeout) so callers
 * running a multi-step sequence never proceed to a dependent step against state
 * that has not landed yet. On the thrown `pending`, do NOT re-sign - check the
 * explorer for the reported hash first.
 */
export async function buildSignSubmit(
  chainId: ChainId,
  buildPath: string,
  buildBody: Record<string, unknown>,
  secretKey: string,
  label: string
): Promise<{ hash: string; txKind: TxKind; status: "success" }> {
  console.log(`\n[${label}] building...`);
  const built = await apiPost<BuildResult>(buildPath, { chainId, ...buildBody });
  console.log(`[${label}] hash: ${built.hash}`);
  if (built.feeStroops !== "0") {
    console.log(`[${label}] service fee: ${built.feeStroops} stroops`);
  }

  // Persist `built.hash` here in a real integration, BEFORE signing, so a crash
  // mid-flight can be reconciled by polling the hash instead of blind-retrying.
  const signed = signXdr(built.xdr, secretKey, chainId);

  console.log(`[${label}] submitting...`);
  await submit(chainId, signed);

  console.log(`[${label}] polling status...`);
  const status = await pollStatus(chainId, built.hash, built.txKind);
  if (status === "failed") {
    throw new ApiError(422, `[${label}] transaction failed on-chain`);
  }
  if (status === "pending") {
    // Unresolved at poll timeout - it may still land. Stop the sequence rather
    // than build a dependent step against state that has not confirmed.
    throw new ApiError(
      408,
      `[${label}] still pending after poll timeout - do NOT re-sign; check the explorer for ${built.hash}`
    );
  }
  console.log(`[${label}] ${status}`);
  return { hash: built.hash, txKind: built.txKind, status };
}

// Public Soroban RPC endpoints, keyed by network. Override with SOROBAN_RPC_URL.
// The Token Tool status endpoint only returns success|failed|pending, so reading
// a deployed contract's address requires a direct Soroban RPC getTransaction.
const SOROBAN_RPC_URL: Record<ChainId, string> = {
  mainnet: "https://rpc.lightsail.network",
  testnet: "https://soroban-testnet.stellar.org",
};

/**
 * After a SEP-41 deploy confirms, fetch the deployed contract address (C...)
 * from the transaction's return value via Soroban RPC. The deployer contract
 * returns the new contract's address as the invocation result, which RPC
 * surfaces as `returnValue`. Retries briefly because RPC may lag confirmation.
 */
export async function getDeployedContractAddress(
  chainId: ChainId,
  hash: string,
  { intervalMs = 3000, timeoutMs = 60000 } = {}
): Promise<string> {
  const url = process.env.SOROBAN_RPC_URL ?? SOROBAN_RPC_URL[chainId];
  const server = new rpc.Server(url, { allowHttp: url.startsWith("http://") });
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await server.getTransaction(hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      if (!res.returnValue) {
        throw new Error(`Transaction ${hash} has no return value`);
      }
      return scValToNative(res.returnValue) as string;
    }
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${hash} failed on-chain`);
    }
    // NOT_FOUND - RPC has not ingested it yet; wait and retry.
    if (Date.now() >= deadline) {
      throw new Error(`Timed out reading contract address for ${hash}`);
    }
    await sleep(intervalMs);
  }
}

interface HeldAsset {
  assetId: string;
  code: string;
  issuer: string;
  balance: string;
  isNativeToken: boolean;
}

/**
 * An account's Classic holdings (including native XLM). A trustline shows up
 * here even at zero balance. An unfunded account yields `[]`, not an error.
 */
export async function heldAssets(
  chainId: ChainId,
  account: string
): Promise<HeldAsset[]> {
  const data = await apiGet<{ assets: HeldAsset[] }>(
    "/classic/account/held-assets",
    { chainId, account }
  );
  return data.assets;
}

/**
 * Whether an account already trusts a Classic asset. A recipient must trust the
 * asset before it can receive it, so probe this before distributing.
 */
export async function hasClassicTrustline(
  chainId: ChainId,
  account: string,
  code: string,
  issuer: string
): Promise<boolean> {
  const assets = await heldAssets(chainId, account);
  return assets.some(
    (a) => !a.isNativeToken && a.code === code && a.issuer === issuer
  );
}

/** Price one or more operations before building. */
export async function feeQuote(
  chainId: ChainId,
  services: string[]
): Promise<{
  totalUSD: number;
  totalXLM: string;
  totalStroops: string;
  enterprise: boolean;
}> {
  return apiGet("/fee-quote", { chainId, services: services.join(",") });
}

const explorerBase = (chainId: ChainId): string =>
  `https://stellar.expert/explorer/${chainId === "mainnet" ? "public" : "testnet"}`;

/** stellar.expert URL for a transaction hash. */
export function explorerTxUrl(chainId: ChainId, hash: string): string {
  return `${explorerBase(chainId)}/tx/${hash}`;
}

/** stellar.expert URL for an account address (G...). */
export function explorerAccountUrl(chainId: ChainId, address: string): string {
  return `${explorerBase(chainId)}/account/${address}`;
}

/** stellar.expert URL for a Soroban contract address (C...). */
export function explorerContractUrl(chainId: ChainId, contract: string): string {
  return `${explorerBase(chainId)}/contract/${contract}`;
}

/** stellar.expert URL for a Classic asset, identified as `code-issuer`. */
export function explorerAssetUrl(
  chainId: ChainId,
  code: string,
  issuer: string
): string {
  return `${explorerBase(chainId)}/asset/${code}-${issuer}`;
}
