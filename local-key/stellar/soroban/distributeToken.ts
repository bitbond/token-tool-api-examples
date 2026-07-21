import {
  buildSignSubmit,
  explorerTxUrl,
  loadSecretKey,
} from "../../../common/stellarApi";
import { ADMIN_ADDRESS, CHAIN_ID, TOKEN_ADDRESS } from "../config";

// ============================================================================
// Distribute a SEP-41 (Soroban) token to many recipients.
//
// Signed by `signer` (the G... admin). Fee-bearing (per recipient). At most 20
// recipients per transaction - larger runs are chunked, each built -> signed ->
// submitted -> polled in turn. SEP-41 destinations may be G... accounts OR C...
// contracts. Amounts are raw base-unit integer strings.
//
// Distribution runs through a distribution contract that moves the signer's
// tokens with transfer_from, so a one-time approval must land first: the signer
// approves the distribution contract as a spender. This script sends that
// approval before the distribute chunks (one approval covers the whole run).
// ============================================================================

// The admin (G...) that holds and sends the tokens.
const SIGNER_ADDRESS = ADMIN_ADDRESS;

// destination: G... or C...; amount: raw base units; message: optional memo.
const RECIPIENTS: Array<{ destination: string; amount: string; message?: string }> = [
  { destination: "G...", amount: "1000000000" },
  { destination: "C...", amount: "2500000000", message: "airdrop" },
];

// SEP-41 distribute allows up to 20 recipients per transaction.
const MAX_PER_TX = 20;

const SIGNER_SECRET = loadSecretKey("./local-key/stellar/issuer_secret_key");

void (async () => {
  try {
    const chunks: Array<typeof RECIPIENTS> = [];
    for (let i = 0; i < RECIPIENTS.length; i += MAX_PER_TX) {
      chunks.push(RECIPIENTS.slice(i, i + MAX_PER_TX));
    }

    console.log(
      `Distributing to ${RECIPIENTS.length} recipient(s) in ${chunks.length} transaction(s).`
    );

    // Approve the distribution contract to move the signer's tokens. Required
    // once before distributing (the distribute build's transfer_from needs an
    // allowance); approving max covers every chunk in this run.
    await buildSignSubmit(
      CHAIN_ID,
      "/soroban/distribute/approve",
      { signer: SIGNER_ADDRESS, tokenAddress: TOKEN_ADDRESS },
      SIGNER_SECRET,
      "approve"
    );

    for (let i = 0; i < chunks.length; i++) {
      // Rebuild each chunk right before signing so the prepared XDR is fresh.
      const result = await buildSignSubmit(
        CHAIN_ID,
        "/soroban/distribute",
        { signer: SIGNER_ADDRESS, tokenAddress: TOKEN_ADDRESS, recipients: chunks[i] },
        SIGNER_SECRET,
        `distribute chunk ${i + 1}/${chunks.length}`
      );
      console.log(explorerTxUrl(CHAIN_ID, result.hash));
    }

    console.log("\nDistribution complete.");
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
