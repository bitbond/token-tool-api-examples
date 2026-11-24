import {
  Client,
  deriveAddress,
  encode,
  SubmittableTransaction,
  TransactionMetadata,
  verifyKeypairSignature,
} from "xrpl";
import { fireblocksClient } from "../../common/fireblocksClient";
import { fireblocksRawSign, vaultPublicKey } from "../../common/fireblocksRawSign";
import {
  BuildResult,
  explorerTxUrl,
  signingDigest,
  toLowSDer,
  xrplWsUrl,
} from "../../common/xrplApi";
import { ASSET_ID, CHAIN_ID } from "./config";

const fireblocks = fireblocksClient();

// How many ledgers (~3-4s each) a signed transaction stays valid. xrpl.js
// defaults to 20 (~1 min), too short for a Fireblocks approval flow; 150 gives
// approvers ~8-10 minutes. Polling Fireblocks stops before that window closes.
const LEDGER_WINDOW = 150;

/** Open a client to the XRPL node for CHAIN_ID. Disconnect it when done. */
export async function connect(): Promise<Client> {
  const client = new Client(xrplWsUrl(CHAIN_ID));
  await client.connect();
  return client;
}

/**
 * Fill `txjson` for `account`, have the Fireblocks vault behind it sign it, and
 * submit it. Resolves with the transaction hash and metadata once validated
 * with tesSUCCESS; throws on any other result.
 *
 * XRPL signs SHA-512Half(0x53545800 || canonical tx without signature) with
 * secp256k1. Fireblocks receives exactly that 32-byte digest as a RAW message;
 * the digest doubles as the Fireblocks externalTxId, so the same filled
 * transaction can never be signed twice.
 */
export async function signAndSubmit(
  client: Client,
  vaultId: string,
  account: string,
  txjson: Record<string, unknown>,
  label: string
): Promise<{ hash: string; meta: TransactionMetadata }> {
  const publicKey = (await vaultPublicKey(fireblocks, vaultId, ASSET_ID)).toUpperCase();
  if (deriveAddress(publicKey) !== account) {
    throw new Error(`Vault ${vaultId} signs as ${deriveAddress(publicKey)}, config expects ${account}`);
  }

  const tx = await client.autofill({ ...txjson, Account: account } as SubmittableTransaction);
  tx.LastLedgerSequence = (await client.getLedgerIndex()) + LEDGER_WINDOW;
  tx.SigningPubKey = publicKey;

  const { signingData, digest } = signingDigest(tx);

  console.log(`\n[${label}] requesting signature from Fireblocks vault ${vaultId}...`);
  const { fullSig } = await fireblocksRawSign(fireblocks, {
    assetId: ASSET_ID,
    vaultId,
    contentHex: digest,
    note: `Token Tool XRPL ${label}`,
    externalTxId: `xrpl-${digest}`,
    timeoutMs: LEDGER_WINDOW * 3000,
  });
  tx.TxnSignature = toLowSDer(fullSig);

  // Check the signature locally before broadcasting anything.
  if (!verifyKeypairSignature(signingData, tx.TxnSignature, publicKey)) {
    throw new Error(`[${label}] Fireblocks signature does not verify against ${publicKey}`);
  }

  console.log(`[${label}] submitting...`);
  const res = await client.submitAndWait(encode(tx));
  const meta = res.result.meta as TransactionMetadata;
  const hash = res.result.hash;
  if (meta.TransactionResult !== "tesSUCCESS") {
    throw new Error(`[${label}] ${meta.TransactionResult}: ${explorerTxUrl(CHAIN_ID, hash)}`);
  }
  console.log(`[${label}] tesSUCCESS ${explorerTxUrl(CHAIN_ID, hash)}`);
  return { hash, meta };
}

/**
 * Pay the Token Tool service fee (when the build carries one), then sign and
 * submit the operation itself - the same order the Token Tool app uses.
 */
export async function submitWithFee(
  client: Client,
  vaultId: string,
  account: string,
  built: BuildResult,
  label: string
): Promise<{ hash: string; meta: TransactionMetadata }> {
  const { feeTransactionJson, amount, receiverAddress } = built.fee;
  if (feeTransactionJson && account !== receiverAddress) {
    console.log(`[${label}] service fee: ${amount} XRP`);
    await signAndSubmit(client, vaultId, account, feeTransactionJson, `${label} fee`);
  }
  return signAndSubmit(client, vaultId, account, built.txjson, label);
}
