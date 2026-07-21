import fs from "fs";
import {
  buildSignSubmit,
  ChainId,
  explorerTxUrl,
  loadSecretKey,
} from "../../../common/stellarApi";

// ============================================================================
// Mint additional supply of an existing Classic asset to the distribution
// account. Only possible while the issuer is still unlocked (i.e. you did NOT
// pass lock: true at issuance and have not locked the issuer since).
//
// Signed by the ISSUER. Zero-fee.
// ============================================================================

const CHAIN_ID: ChainId = "testnet";

const CODE = "ABC";
const ISSUER_ADDRESS = "G...";
const DISTRIBUTION_ADDRESS = "G..."; // must differ from the issuer

// Additional amount to mint, human-decimal string (max 7 decimal places).
const AMOUNT = "5000";

const ISSUER_SECRET = loadSecretKey(
  "./local-key/stellar/issuer_secret_key",
  fs
);

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
