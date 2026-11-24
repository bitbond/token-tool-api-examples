import { apiPost, explorerTxUrl } from "../../common/xrplApi";
import { CHAIN_ID, DECIMALS, ISSUER_ADDRESS, ISSUER_VAULT_ID } from "./config";
import { connect, submitWithFee } from "./signer";

// ============================================================================
// Create an XRPL Multi-Purpose Token (MPT) issued by a Fireblocks vault.
//
// One MPTokenIssuanceCreate transaction, signed by the issuer vault. On mainnet
// the Token Tool service fee is paid first, in a separate XRP Payment signed by
// the same vault (testnet is free). The issuer is the token's sole administrator:
// it mints (by paying holders), authorizes, locks and claws back.
// ============================================================================

const TOKEN = {
  // Up to 40 characters.
  name: "ABC Fund Token",
  // Ticker: up to 6 uppercase letters/digits.
  symbol: "ABC",
  // Optional, up to 200 characters.
  description: "",
  // Token icon URL (required).
  iconUrl: "https://example.com/abc.png",
  // rwa | memes | wrapped | gaming | defi | other
  assetClass: "rwa",
  // Required when assetClass is "rwa":
  // stablecoin | commodity | real_estate | private_credit | equity | treasury | other
  assetSubclass: "treasury",
  // Up to 60 characters.
  issuerName: "ABC Issuer Ltd",

  // AssetScale: decimals, 0-15. Immutable after creation.
  assetScale: DECIMALS,
  // Hard cap, human-decimal string. Leave "" for the protocol maximum. Required
  // when canMint is false (the cap is what enforces "no more minting" on-chain).
  maximumSupply: "",
  // Transfer fee charged on holder-to-holder transfers, percent 0-50.
  transferFee: 0,

  // On-chain capability flags. All are immutable after creation.
  canTransfer: true, // holders may transfer to each other (not only to/from issuer)
  canLock: true, // issuer may freeze one holder or the whole token
  requireAuth: true, // issuer must authorize each holder before they can hold it
  canClawback: true, // issuer may claw tokens back from holders
  canEscrow: false,
  canTrade: false, // tradable on the XRPL DEX
  // App-level settings: an MPT issuer can always mint up to maximumSupply, and
  // burning is a clawback, so canBurn requires canClawback.
  canMint: true,
  canBurn: true,
};

void (async () => {
  const client = await connect();
  try {
    const built = await apiPost("/build-mpt-tx", {
      chainId: CHAIN_ID,
      address: ISSUER_ADDRESS,
      ...TOKEN,
    });

    const { hash, meta } = await submitWithFee(client, ISSUER_VAULT_ID, ISSUER_ADDRESS, built, "create");

    const issuanceId = (meta as { mpt_issuance_id?: string }).mpt_issuance_id;
    console.log(`\nToken ${TOKEN.symbol} created.`);
    console.log(`Issuance ID: ${issuanceId ?? "(not in metadata - read it from the explorer)"}`);
    console.log(`Create tx:   ${explorerTxUrl(CHAIN_ID, hash)}`);
    console.log(
      "\nSet ISSUANCE_ID in fireblocks/xrpl/config.ts to use it from the other scripts."
    );
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
  }
})();
