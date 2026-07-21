import {
  buildSignSubmit,
  ChainId,
  explorerTxUrl,
  feeQuote,
  loadSecretKey,
} from "../../../common/stellarApi";

// ============================================================================
// Deploy a SEP-41 (Soroban) token. Unlike a Classic asset, a SEP-41 token is a
// single smart-contract deployment: one build -> sign -> submit -> poll cycle.
//
// The `address` (a G... account) becomes the token admin and signs the deploy.
// The build endpoint simulates and prepares the contract call server-side and
// embeds the service fee. The prepared footprint + resource fee go stale
// quickly, so sign and submit promptly.
//
// SEP-41 amounts (initialSupply, balanceLimit, ...) are raw base-unit integer
// strings in the token's own decimals. For a 7-decimal token, a supply of 1000
// tokens is "10000000000" (1000 * 10^7).
// ============================================================================

const CHAIN_ID: ChainId = "testnet";

// The admin account (G...) that deploys and owns the token.
const ADMIN_ADDRESS = "G...";

const DECIMALS = 7;
// Raw base-unit supply. Here: 1,000,000 tokens with DECIMALS decimals.
const INITIAL_SUPPLY = (1_000_000n * 10n ** BigInt(DECIMALS)).toString();

const TOKEN = {
  address: ADMIN_ADDRESS,
  tokenName: "My Soroban Token",
  symbol: "MST",
  initialSupply: INITIAL_SUPPLY,
  decimals: DECIMALS,

  // Capabilities - enable the ones you want the admin to retain post-deploy.
  canMint: true,
  canBurn: true,
  canPause: false,
  canBlacklist: false,
  forceTransferEnabled: false,
  whitelistEnabled: false,

  // Optional document URI.
  hasDocumentUri: false,
  documentUri: "",

  // Optional per-address balance cap (raw base units; "0" when disabled).
  hasBalanceLimit: false,
  balanceLimit: "0",

  // Transfer tax (basis points, 0-10000) paid to taxAddress on each transfer.
  isTaxable: false,
  taxAddress: ADMIN_ADDRESS,
  taxBPS: 0,

  // Deflation: basis points burned on each transfer.
  isDeflationary: false,
  deflationBPS: 0,
};

const ADMIN_SECRET = loadSecretKey("./local-key/stellar/issuer_secret_key");

void (async () => {
  try {
    const quote = await feeQuote(CHAIN_ID, ["createToken"]);
    console.log(
      `Estimated cost: ${quote.totalUSD} USD (${quote.totalXLM} XLM)` +
        (quote.enterprise ? " [enterprise]" : "")
    );

    // Deploy is a single build -> sign -> submit -> poll cycle. The shared
    // helper simulates + prepares + embeds the fee server-side, signs the
    // prepared XDR promptly (a SEP-41 footprint goes stale as state moves), and
    // enforces the submit/poll contract (throws on failed AND on an unresolved
    // pending - do NOT re-sign; check the explorer for the reported hash).
    const { hash } = await buildSignSubmit(
      CHAIN_ID,
      "/soroban/create/build",
      TOKEN,
      ADMIN_SECRET,
      "deploy"
    );

    console.log(`\nToken ${TOKEN.symbol} deployed by ${ADMIN_ADDRESS}`);
    console.log(explorerTxUrl(CHAIN_ID, hash));
    console.log(
      "Find the deployed contract (C...) address from the transaction on the " +
        "explorer - you pass it as `tokenAddress` to the manage/distribute scripts."
    );
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
