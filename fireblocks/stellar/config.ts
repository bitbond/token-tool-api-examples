import { ChainId } from "../../common/stellarApi";

// ============================================================================
// Shared configuration for the Fireblocks Stellar examples. Edit these once;
// every script reads the account/asset/vault identifiers from here.
// Operation-specific knobs (compliance flags, recipient lists, the chosen manage
// action, mint amounts) stay in the individual scripts.
//
// Each Stellar account below is the XLM deposit address of a Fireblocks vault
// account. Add the XLM (or XLM_TEST) asset to the vault and fund it with XLM
// for reserves + fees before running any script.
// ============================================================================

// "testnet" (Stellar test network) or "mainnet" (Stellar public network).
export const CHAIN_ID = "testnet" as ChainId;

// Fireblocks asset ID for native XLM on CHAIN_ID. Selects which vault key signs.
export const ASSET_ID = CHAIN_ID === "mainnet" ? "XLM" : "XLM_TEST";

// --- Classic asset -------------------------------------------------------

// Asset code: 1-12 alphanumeric characters (e.g. "ABC", "GOLD").
export const CODE = "ABC";

// Issuer: Fireblocks vault ID + that vault's XLM address (G...). Signs flags,
// issuance, mint and manage.
export const ISSUER_VAULT_ID = "0";
export const ISSUER_ADDRESS = "G...";

// Distribution: a DIFFERENT vault (an issuer cannot hold its own asset). Holds
// and distributes the issued supply; signs the trustline + distribute.
export const DISTRIBUTION_VAULT_ID = "1";
export const DISTRIBUTION_ADDRESS = "G...";

// Total supply to mint, human-decimal string (max 7 decimal places).
export const SUPPLY = "1000000";

// --- Soroban (SEP-41) token ----------------------------------------------

// The admin vault that deploys and manages the SEP-41 token. Reuses the issuer
// vault here, but it can be any funded vault.
export const ADMIN_VAULT_ID = ISSUER_VAULT_ID;
export const ADMIN_ADDRESS = ISSUER_ADDRESS;

// The deployed token contract (C...). Fill this in after running deployToken.ts
// (it is printed on the deploy output).
export const TOKEN_ADDRESS = "C...";
