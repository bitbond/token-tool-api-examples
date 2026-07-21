import {
  buildSignSubmit,
  ChainId,
  explorerAccountUrl,
  explorerAssetUrl,
  explorerTxUrl,
  feeQuote,
  loadSecretKey,
} from "../../../common/stellarApi";

// ============================================================================
// Create a Stellar *Classic* asset (a SEP-based issued asset on Horizon).
//
// A Classic asset is created in three ordered steps, each a separate signed
// transaction:
//
//   1. flags     - the issuer sets its compliance flags (auth required /
//                  revocable / clawback). Signed by the ISSUER.
//   2. trustline - the distribution account opens a trustline to the asset so
//                  it can hold it. Signed by the DISTRIBUTION account.
//   3. issuance  - the issuer mints `supply` to the distribution account. With
//                  `lock: true` the issuer's signers are removed in the same
//                  transaction, permanently fixing the supply. Signed by the
//                  ISSUER. This is the only fee-bearing step.
//
// `issuer` and `distributionAddress` MUST be different accounts - an issuer
// cannot hold its own asset. Both accounts must already exist and be funded
// with XLM (for reserves + fees) before running this script.
// ============================================================================

// ---------------------------------------------------------------------------
// CONFIGURATION - edit these values
// ---------------------------------------------------------------------------

// "testnet" (Stellar test network) or "mainnet" (Stellar public network).
const CHAIN_ID: ChainId = "testnet";

// The asset code: 1-12 alphanumeric characters (e.g. "ABC", "GOLD").
const CODE = "ABC";

// The issuer account (G...). Its secret key signs the flags + issuance steps.
const ISSUER_ADDRESS = "G...";

// The distribution account (G...). Must differ from the issuer. Its secret key
// signs the trustline step and receives the issued supply.
const DISTRIBUTION_ADDRESS = "G...";

// Total supply to mint, as a human-decimal string (max 7 decimal places).
const SUPPLY = "1000000";

// Compliance flags set on the issuer. Set at least one to true, otherwise this
// asset needs no flags and you can skip straight to trustline + issuance below.
// `authClawbackEnabled` requires `authRevocable`.
const FLAGS = {
  authRequired: false,
  authRevocable: false,
  authClawbackEnabled: false,
};
const SET_FLAGS = FLAGS.authRequired || FLAGS.authRevocable || FLAGS.authClawbackEnabled;

// If true, remove the issuer's signers during issuance to fix the supply
// permanently (no further minting possible). A flagged issuer refuses the lock -
// keep this false if you set any compliance flag above, or lock separately later.
const LOCK_SUPPLY = false;

// Secret keys (S...) read from files. See secret_key.example for the format.
// The *_key filename suffix is gitignored - never commit real keys.
const ISSUER_SECRET = loadSecretKey("./local-key/stellar/issuer_secret_key");
const DISTRIBUTION_SECRET = loadSecretKey("./local-key/stellar/distribution_secret_key");

// ---------------------------------------------------------------------------

void (async () => {
  try {
    // A flagged issuer refuses the lock, so locking supply is incompatible with
    // setting compliance flags. Fail loudly rather than silently leaving the
    // supply unlocked when both are requested.
    if (LOCK_SUPPLY && SET_FLAGS) {
      throw new Error(
        "LOCK_SUPPLY cannot be combined with compliance FLAGS - a flagged " +
          "issuer refuses the lock. Set LOCK_SUPPLY to false, or clear the " +
          "flags and lock separately later via manageAsset.ts (lock-issuer)."
      );
    }

    const createBody = {
      code: CODE,
      issuer: ISSUER_ADDRESS,
      distributionAddress: DISTRIBUTION_ADDRESS,
    };

    // Preview the cost (only issuance bears a fee).
    const quote = await feeQuote(CHAIN_ID, ["createToken"]);
    console.log(
      `Estimated cost: ${quote.totalUSD} USD (${quote.totalXLM} XLM)` +
        (quote.enterprise ? " [enterprise: zero per-deployment fee]" : "")
    );

    // 1. Flags (issuer-signed, zero-fee). Skip if no compliance flag is set.
    if (SET_FLAGS) {
      await buildSignSubmit(
        CHAIN_ID,
        "/classic/create/flags/build",
        { ...createBody, flags: FLAGS },
        ISSUER_SECRET,
        "flags"
      );
    } else {
      console.log("\n[flags] no compliance flags set - skipping");
    }

    // 2. Trustline (distribution-signed, zero-fee).
    await buildSignSubmit(
      CHAIN_ID,
      "/classic/create/trustline/build",
      createBody,
      DISTRIBUTION_SECRET,
      "trustline"
    );

    // 3. Issuance (issuer-signed, fee-bearing).
    const issuance = await buildSignSubmit(
      CHAIN_ID,
      "/classic/create/issuance/build",
      { ...createBody, supply: SUPPLY, lock: LOCK_SUPPLY },
      ISSUER_SECRET,
      "issuance"
    );

    console.log(`\nAsset ${CODE} created (supply: ${SUPPLY}).`);
    console.log(`Asset:        ${explorerAssetUrl(CHAIN_ID, CODE, ISSUER_ADDRESS)}`);
    console.log(`Issuer:       ${explorerAccountUrl(CHAIN_ID, ISSUER_ADDRESS)}`);
    console.log(`Distribution: ${explorerAccountUrl(CHAIN_ID, DISTRIBUTION_ADDRESS)}`);
    console.log(`Issuance tx:  ${explorerTxUrl(CHAIN_ID, issuance.hash)}`);
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
