import {
  buildSignSubmit,
  explorerTxUrl,
  loadSecretKey,
} from "../../../common/stellarApi";
import {
  CHAIN_ID,
  CODE,
  DISTRIBUTION_ADDRESS,
  ISSUER_ADDRESS,
} from "../config";

// ============================================================================
// Mint additional supply of an existing Classic asset to the distribution
// account. Only possible while the issuer is still unlocked (i.e. you did NOT
// pass lock: true at issuance and have not locked the issuer since).
//
// Signed by the ISSUER. Zero-fee.
// ============================================================================

// Additional amount to mint, human-decimal string (max 7 decimal places).
const AMOUNT = "5000";

const ISSUER_SECRET = loadSecretKey("./local-key/stellar/issuer_secret_key");

void (async () => {
  try {
    const result = await buildSignSubmit(
      CHAIN_ID,
      "/classic/manage/mint/build",
      {
        code: CODE,
        issuer: ISSUER_ADDRESS,
        distributionAddress: DISTRIBUTION_ADDRESS,
        amount: AMOUNT,
      },
      ISSUER_SECRET,
      "mint"
    );
    console.log(`\nMinted ${AMOUNT} ${CODE} to ${DISTRIBUTION_ADDRESS}`);
    console.log(explorerTxUrl(CHAIN_ID, result.hash));
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
