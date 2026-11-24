import { createHash } from "crypto";
import { encodeForSigning, SubmittableTransaction } from "xrpl";

// ============================================================================
// Shared helpers for the Bitbond Token Tool XRPL API. Token Tool issues XRPL
// Multi-Purpose Tokens (MPT, XLS-33).
//
// The API is non-custodial: each build endpoint returns an *unsigned, unfilled*
// transaction (`txjson`, without Account / Sequence / Fee) plus the Token Tool
// service fee. Your side fills the transaction, signs it with your own key
// custody and submits it to an XRPL node:
//
//   1. Build    - POST /xrpl/api/<action>-mpt-tx -> { txjson, fee }
//   2. Fee      - if fee.feeTransactionJson is set, sign + submit that Payment
//                 first (it pays fee.drops to Token Tool's receiver address)
//   3. Fill     - set Account, autofill Sequence / Fee / LastLedgerSequence
//   4. Sign     - sign with the account's key, submit, wait for validation
//
// Testnet builds carry no service fee (feeTransactionJson is null).
// ============================================================================

// Override the host with the TOKEN_TOOL_HOST env var (e.g. a PR preview URL).
const HOST = process.env.TOKEN_TOOL_HOST ?? "https://tokentool.bitbond.com";
export const BASE_URL = `${HOST}/xrpl/api`;

// `xrpl` is XRPL mainnet, `xrpl-testnet` the XRPL testnet.
export type XrplChainId = "xrpl" | "xrpl-testnet";

// Public XRPL WebSocket endpoints. Override with the XRPL_WS_URL env var.
const XRPL_WS_URL: Record<XrplChainId, string> = {
  xrpl: "wss://xrplcluster.com",
  "xrpl-testnet": "wss://s.altnet.rippletest.net:51233",
};
export const xrplWsUrl = (chainId: XrplChainId): string =>
  process.env.XRPL_WS_URL ?? XRPL_WS_URL[chainId];

export interface ServiceFee {
  // Fee in XRP ("0" when free or on testnet).
  amount: string;
  drops: string;
  receiverAddress: string;
  // A Payment to submit before the operation, or null when there is no fee.
  feeTransactionJson: Record<string, unknown> | null;
}

// Shape returned by every single-transaction build endpoint.
export interface BuildResult {
  txjson: Record<string, unknown>;
  fee: ServiceFee;
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; errors: Array<{ title: string; status?: number }> };

/** POST a JSON body to a Token Tool XRPL endpoint and return its `data`. */
export async function apiPost<T = BuildResult>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: Envelope<T>;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new Error(`${path} failed with HTTP ${res.status}`);
  }
  if (!json.success) {
    throw new Error(`${path} failed (${res.status}): ${json.errors?.[0]?.title ?? "unknown error"}`);
  }
  return json.data;
}

export interface OptInStatus {
  holder: string;
  optedIn: boolean;
  authorized: boolean;
  locked: boolean;
  // Raw base units.
  balance: string;
}

/**
 * Whether each holder has opted in to (and, for requireAuth tokens, been
 * authorized for) an MPT. A holder cannot receive an MPT before opting in.
 * Up to 200 holders per call.
 */
export async function optInStatus(
  chainId: XrplChainId,
  issuanceId: string,
  holders: string[]
): Promise<OptInStatus[]> {
  const data = await apiPost<{ statuses: OptInStatus[] }>("/xrpl/opt-in-status", {
    chainId,
    issuanceId,
    holders,
  });
  return data.statuses;
}

/** XRPL explorer URL for a transaction hash. */
export const explorerTxUrl = (chainId: XrplChainId, hash: string): string =>
  `https://${chainId === "xrpl" ? "livenet" : "testnet"}.xrpl.org/transactions/${hash}`;

/**
 * What an XRPL single signer signs: SHA-512Half of the signing payload
 * (0x53545800 prefix + canonical binary of the tx without TxnSignature).
 * `tx` must already carry SigningPubKey. Returns both, as hex.
 */
export function signingDigest(tx: SubmittableTransaction): { signingData: string; digest: string } {
  const signingData = encodeForSigning(tx);
  const digest = createHash("sha512")
    .update(Buffer.from(signingData, "hex"))
    .digest()
    .subarray(0, 32)
    .toString("hex");
  return { signingData, digest };
}

// secp256k1 group order. XRPL only accepts "low-S" signatures (s <= N/2).
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** Encode a 64-byte r||s hex signature as the low-S DER hex XRPL expects. */
export function toLowSDer(fullSig: string): string {
  const r = BigInt(`0x${fullSig.slice(0, 64)}`);
  let s = BigInt(`0x${fullSig.slice(64, 128)}`);
  if (s > N / 2n) s = N - s;
  const derInt = (x: bigint) => {
    let hex = x.toString(16);
    if (hex.length % 2) hex = `0${hex}`;
    if (parseInt(hex.slice(0, 2), 16) >= 0x80) hex = `00${hex}`; // keep it positive
    return `02${(hex.length / 2).toString(16).padStart(2, "0")}${hex}`;
  };
  const body = derInt(r) + derInt(s);
  return `30${(body.length / 2).toString(16).padStart(2, "0")}${body}`.toUpperCase();
}
