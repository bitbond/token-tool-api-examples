import { Networks, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { fireblocksRawSign } from "../../common/fireblocksRawSign";
import { XdrSigner } from "../../common/stellarApi";
import { ASSET_ID, CHAIN_ID, fireblocksClient } from "./config";

const fireblocks = fireblocksClient();

/**
 * An XdrSigner backed by a Fireblocks vault. Stellar signs the 32-byte
 * transaction hash with Ed25519, so we send that hash to Fireblocks as a RAW
 * message and attach the returned signature to the envelope. The Token Tool
 * build already fixed the hash, so it doubles as the Fireblocks externalTxId:
 * the same transaction can never be signed twice.
 *
 * `expectedAddress` is the vault's XLM address from config; addSignature throws
 * if the vault key does not match it, so a wrong VAULT_ID fails before submit.
 */
export const fireblocksSigner =
  (vaultId: string, expectedAddress: string): XdrSigner =>
  async (xdr, label) => {
    const passphrase = CHAIN_ID === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
    const tx = TransactionBuilder.fromXDR(xdr, passphrase);
    const hash = tx.hash().toString("hex");

    console.log(`[${label}] requesting signature from Fireblocks vault ${vaultId}...`);
    const { fullSig, publicKey } = await fireblocksRawSign(fireblocks, {
      assetId: ASSET_ID,
      vaultId,
      contentHex: hash,
      note: `Token Tool Stellar ${label}`,
      externalTxId: `stellar-${hash}`,
    });

    // Fireblocks may prefix Ed25519 keys with a 00 byte; the key is the last 32.
    const signer = StrKey.encodeEd25519PublicKey(Buffer.from(publicKey.slice(-64), "hex"));
    if (signer !== expectedAddress) {
      throw new Error(`Vault ${vaultId} signs as ${signer}, config expects ${expectedAddress}`);
    }
    // Verifies the signature against the hash before attaching it.
    tx.addSignature(signer, Buffer.from(fullSig, "hex").toString("base64"));
    return tx.toXDR();
  };
