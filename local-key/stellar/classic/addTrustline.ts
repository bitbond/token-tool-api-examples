import {
  accountAddress,
  buildSignSubmit,
  explorerAccountUrl,
  loadSecretKey,
} from "../../../common/stellarApi";
import { CHAIN_ID, CODE, ISSUER_ADDRESS } from "../config";

// ============================================================================
// Establish a trustline from a holder account to the Classic asset so it can
// receive the asset (a Classic payment fails if the recipient does not trust
// the asset). Signed by the HOLDER, zero-fee.
//
// A trustline is the holder's own action - it needs the holder's signature and
// XLM reserve - so this script only works for accounts YOU control (e.g. test
// recipients you funded). In production, each holder adds their own trustline
// via a Stellar wallet or the Bitbond Token Tool UI (see the README).
//
// This reuses the create/trustline build endpoint, which builds a changeTrust
// for whatever account is passed as the source - here the holder, not the
// distribution account.
// ============================================================================

// The holder's secret key (S...). Fund the account first (testnet: friendbot).
const HOLDER_SECRET = loadSecretKey("./local-key/stellar/holder_secret_key");
const HOLDER_ADDRESS = accountAddress(HOLDER_SECRET);

void (async () => {
  try {
    const result = await buildSignSubmit(
      CHAIN_ID,
      "/classic/create/trustline/build",
      // `distributionAddress` is the changeTrust source - the holder here.
      { code: CODE, issuer: ISSUER_ADDRESS, distributionAddress: HOLDER_ADDRESS },
      HOLDER_SECRET,
      "trustline"
    );
    console.log(`\n${HOLDER_ADDRESS} now trusts ${CODE}-${ISSUER_ADDRESS}`);
    console.log(explorerAccountUrl(CHAIN_ID, HOLDER_ADDRESS));
    console.log(`tx: ${result.hash}`);
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
