import {
  buildSubmitWith,
  explorerTxUrl,
} from "../../../common/stellarApi";
import {
  CHAIN_ID,
  CODE,
  DISTRIBUTION_ADDRESS,
  ISSUER_ADDRESS,
  ISSUER_VAULT_ID,
} from "../config";
import { fireblocksSigner } from "../signer";

// ============================================================================
// Mint additional supply of an existing Classic asset to the distribution
// account. Only possible while the issuer is still unlocked (i.e. you did NOT
// pass lock: true at issuance and have not locked the issuer since).
//
// Signed by the ISSUER. Zero-fee.
// ============================================================================

// Additional amount to mint, human-decimal string (max 7 decimal places).
const AMOUNT = "5000";

const ISSUER_SIGNER = fireblocksSigner(ISSUER_VAULT_ID, ISSUER_ADDRESS);

void (async () => {
  try {
    const result = await buildSubmitWith(
      CHAIN_ID,
      "/classic/manage/mint",
      {
        code: CODE,
        issuer: ISSUER_ADDRESS,
        distributionAddress: DISTRIBUTION_ADDRESS,
        amount: AMOUNT,
      },
      ISSUER_SIGNER,
      "mint"
    );
    console.log(`\nMinted ${AMOUNT} ${CODE} to ${DISTRIBUTION_ADDRESS}`);
    console.log(explorerTxUrl(CHAIN_ID, result.hash));
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
