import { ChainId } from "../../common/stellarApi";

// ============================================================================
// Shared configuration for the Stellar examples. Edit these once; every script
// reads the account/asset identifiers from here so you don't repeat them across
// files when running the full lifecycle. Operation-specific knobs (compliance
// flags, recipient lists, the chosen manage action, mint amounts) stay in the
// individual scripts.
// ============================================================================

// "testnet" (Stellar test network) or "mainnet" (Stellar public network).
export const CHAIN_ID: ChainId = "testnet";

// --- Classic asset -------------------------------------------------------

// Asset code: 1-12 alphanumeric characters (e.g. "ABC", "GOLD").
export const CODE = "ABC";

// The issuer account (G...). Its secret key signs flags + issuance + manage.
export const ISSUER_ADDRESS = "G...";

// The distribution account (G...). Must differ from the issuer. Holds and
// distributes the issued supply; its secret key signs the trustline + distribute.
export const DISTRIBUTION_ADDRESS = "G...";

// Total supply to mint, human-decimal string (max 7 decimal places).
export const SUPPLY = "1000000";

// --- Soroban (SEP-41) token ----------------------------------------------

// The admin account (G...) that deploys and manages the SEP-41 token. Reuses
// the issuer here, but it can be any funded G... account.
export const ADMIN_ADDRESS = ISSUER_ADDRESS;

// The deployed token contract (C...). Fill this in after running deployToken.ts
// (it is printed on the deploy output).
export const TOKEN_ADDRESS = "C...";
