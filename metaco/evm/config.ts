// ============================================================================
// Shared configuration for the Metaco Harmonize EVM examples. Edit these once;
// every script reads the network/token identifiers from here so you don't
// repeat them across files. Operation-specific knobs (token properties,
// recipients, amounts) stay in the individual scripts.
// ============================================================================

// Chain ID of the target EVM network (11155111 = Ethereum Sepolia testnet).
// Supported networks are listed in the Bitbond Token Tool documentation.
export const CHAIN_ID = 11155111;

// Token Tool factory contract for CHAIN_ID (from the Token Tool documentation).
export const FACTORY_ADDRESS = "0x4904Ba3148147D2f78b05a8446C01c48a7ABa4bd";

// The account that deploys and owns the token.
export const ISSUER_ADDRESS = "0x...";

// Decimals the token uses. Set at deploy, then reused to parse mint/burn/transfer
// amounts.
export const TOKEN_DECIMALS = 18;
