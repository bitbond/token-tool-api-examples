import { BasePath, Fireblocks } from "@fireblocks/ts-sdk";
import fs from "fs";
import { XrplChainId } from "../../common/xrplApi";

// ============================================================================
// Shared configuration for the Fireblocks XRPL examples. Edit these once; every
// script reads the network/token/vault identifiers from here. Operation-specific
// knobs (token properties, recipients, amounts, the chosen manage action) stay
// in the individual scripts.
//
// Each XRPL account below is the XRP deposit address of a Fireblocks vault
// account. Add the XRP (or XRP_TEST) asset to the vault and fund it with XRP for
// the account reserve + fees before running any script.
// ============================================================================

// "xrpl-testnet" (XRPL testnet) or "xrpl" (XRPL mainnet).
export const CHAIN_ID = "xrpl-testnet" as XrplChainId;

// Fireblocks asset ID for native XRP on CHAIN_ID. Selects which vault key signs.
export const ASSET_ID = CHAIN_ID === "xrpl" ? "XRP" : "XRP_TEST";

// Issuer: Fireblocks vault ID + that vault's XRP address (r...). Creates the
// MPT and signs every issuer-side operation (mint, distribute, manage).
export const ISSUER_VAULT_ID = "0";
export const ISSUER_ADDRESS = "r...";

// The MPT issuance ID (48 hex chars). Fill this in after running
// createToken.ts (it is printed on the create output).
export const ISSUANCE_ID = "";

// Decimals (AssetScale) the token uses. Set at create, then reused to convert
// human amounts to base units for mint / distribute / clawback.
export const DECIMALS = 6;

// Fireblocks client built from the API user key + secret key files. The *_key
// suffix is gitignored - never commit real keys.
export const fireblocksClient = (): Fireblocks =>
  new Fireblocks({
    apiKey: fs.readFileSync("./fireblocks/xrpl/fireblocks_api_key", "utf-8").trim(),
    basePath: BasePath.EU,
    secretKey: fs.readFileSync("./fireblocks/xrpl/fireblocks_private_key", "utf-8").trim(),
  });
