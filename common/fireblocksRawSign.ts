import { Fireblocks, TransactionOperation, TransferPeerPathType } from "@fireblocks/ts-sdk";

// ============================================================================
// Fireblocks RAW signing, shared by the Stellar and XRPL examples.
//
// Fireblocks has no native "contract call" for Soroban or XRPL MPT transactions,
// so the examples hand Fireblocks the 32-byte payload the chain expects to be
// signed and attach the returned signature themselves:
//
//   Stellar (Ed25519)   - content = the transaction hash (Fireblocks signs it as
//                         the Ed25519 message, exactly like Keypair.sign(hash)).
//   XRPL (secp256k1)    - content = SHA-512Half of the signing payload (Fireblocks
//                         signs the 32-byte digest as-is).
//
// RAW signing is disabled by default in production workspaces - ask your
// Fireblocks CSM to enable it - and the Transaction Authorization Policy (TAP)
// must contain a rule allowing RAW operations from the signing vault.
// ============================================================================

const TERMINAL_FAILURES = new Set(["FAILED", "REJECTED", "BLOCKED", "CANCELLED"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RawSignature {
  // Hex signature. Ed25519: 64 bytes (R || S). secp256k1: 64 bytes (r || s).
  fullSig: string;
  // Hex public key of the key that signed.
  publicKey: string;
}

/**
 * Ask Fireblocks to sign one 32-byte hex payload with the key behind
 * `vaultId`/`assetId`, wait for the request to clear the TAP (approvals
 * included), and return the signature.
 *
 * `externalTxId` makes the request idempotent: Fireblocks refuses a second
 * request with the same value, so a crashed-and-restarted script cannot get the
 * same transaction signed twice. The examples pass the payload hash.
 */
export async function fireblocksRawSign(
  fireblocks: Fireblocks,
  {
    assetId,
    vaultId,
    contentHex,
    note,
    externalTxId,
    intervalMs = 2000,
    timeoutMs = 170_000,
  }: {
    assetId: string;
    vaultId: string;
    contentHex: string;
    note: string;
    externalTxId: string;
    intervalMs?: number;
    timeoutMs?: number;
  }
): Promise<RawSignature> {
  const { data: created } = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      operation: TransactionOperation.Raw,
      assetId,
      source: { type: TransferPeerPathType.VaultAccount, id: vaultId },
      note,
      externalTxId,
      extraParameters: {
        rawMessageData: { messages: [{ content: contentHex }] },
      },
    },
  });
  const txId = created.id;
  if (!txId) throw new Error(`Fireblocks did not create the RAW request: ${JSON.stringify(created)}`);
  console.log(`  Fireblocks RAW request ${txId} (${created.status})`);

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { data: tx } = await fireblocks.transactions.getTransaction({ txId });
    if (tx.status === "COMPLETED") {
      const signed = tx.signedMessages?.[0];
      if (!signed?.signature?.fullSig || !signed.publicKey) {
        throw new Error(`Fireblocks ${txId} completed without a signature`);
      }
      return { fullSig: signed.signature.fullSig, publicKey: signed.publicKey };
    }
    if (tx.status && TERMINAL_FAILURES.has(tx.status)) {
      throw new Error(`Fireblocks ${txId} ended ${tx.status} (${tx.subStatus ?? "no sub-status"})`);
    }
    if (Date.now() >= deadline) {
      // The unsigned transaction will have expired on-chain by now; cancel the
      // request in the Fireblocks console and rebuild instead of approving it.
      throw new Error(`Fireblocks ${txId} still ${tx.status} after ${timeoutMs}ms`);
    }
    await sleep(intervalMs);
  }
}

/** Public key (hex) behind a vault's deposit address for `assetId`. */
export async function vaultPublicKey(
  fireblocks: Fireblocks,
  vaultId: string,
  assetId: string
): Promise<string> {
  const { data } = await fireblocks.vaults.getPublicKeyInfoForAddress({
    vaultAccountId: vaultId,
    assetId,
    change: 0,
    addressIndex: 0,
    compressed: true,
  });
  if (!data.publicKey) throw new Error(`No public key for vault ${vaultId} / ${assetId}`);
  return data.publicKey;
}
