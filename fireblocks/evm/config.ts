import { BasePath, Fireblocks } from "@fireblocks/ts-sdk";
import fs from "fs";

// ============================================================================
// Shared configuration for the Fireblocks EVM examples. Edit these once; every
// script reads the network/token/vault identifiers from here so you don't
// repeat them across files when running the full lifecycle. Operation-specific
// knobs (token properties, recipients, amounts, the per-transaction note and
// externalTxId) stay in the individual scripts.
// ============================================================================

// Chain ID of the target EVM network (11155111 = Ethereum Sepolia testnet).
// Supported networks are listed in the Bitbond Token Tool documentation.
export const CHAIN_ID = 11155111;

// Token Tool factory contract for CHAIN_ID (from the Token Tool documentation).
export const FACTORY_ADDRESS = "0x4904Ba3148147D2f78b05a8446C01c48a7ABa4bd";

// The Fireblocks vault account address that deploys and owns the token.
export const ISSUER_ADDRESS = "0x...";

// The deployed token contract. Fill this in after running deployToken.ts. Used
// by mint/burn/transfer.
export const TOKEN_ADDRESS = "0x...";

// Decimals the token uses. Set at deploy, then reused to parse mint/burn/transfer
// amounts.
export const TOKEN_DECIMALS = 18;

// Fireblocks vault ID that signs the transactions. Any vault with enough balance
// to cover the fee (and that owns the tokens, for mint/burn/transfer).
export const VAULT_ID = "0";

// Fireblocks native asset code selecting the network (ETH_TEST5 = Sepolia).
// Refer to the Fireblocks documentation for other native asset codes.
export const ASSET_ID = "ETH_TEST5";

// Fireblocks client built from the API user key + secret key files. The *_key
// suffix is gitignored - never commit real keys.
export const fireblocksClient = (): Fireblocks =>
  new Fireblocks({
    apiKey: fs.readFileSync("./fireblocks/evm/fireblocks_api_key", "utf-8").trim(),
    basePath: BasePath.EU,
    secretKey: fs.readFileSync("./fireblocks/evm/fireblocks_private_key", "utf-8").trim(),
  });
