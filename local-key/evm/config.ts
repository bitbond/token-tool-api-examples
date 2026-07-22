// ============================================================================
// Shared configuration for the local-key EVM examples. Edit these once; every
// script reads the network/token identifiers from here so you don't repeat them
// across files when running the full lifecycle. Operation-specific knobs (token
// properties, recipients, mint/burn/transfer amounts) stay in the individual
// scripts.
// ============================================================================

// Chain ID of the target EVM network (11155111 = Ethereum Sepolia testnet).
// Supported networks are listed in the Bitbond Token Tool documentation.
export const CHAIN_ID = 11155111;

// RPC endpoint for CHAIN_ID. Used to sign, send, and confirm transactions.
export const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// Token Tool factory contract for CHAIN_ID (from the Token Tool documentation).
export const FACTORY_ADDRESS = "0x4904Ba3148147D2f78b05a8446C01c48a7ABa4bd";

// The account that deploys and owns the token. Its private key (see below) signs.
export const ISSUER_ADDRESS = "0x...";

// The deployed token contract. Fill this in after running deployToken.ts (it
// prints the address). Used by mint/burn/transfer/verify.
export const TOKEN_ADDRESS = "0x...";

// Decimals the token uses. Set at deploy, then reused to parse mint/burn/transfer
// amounts.
export const TOKEN_DECIMALS = 18;

// Path to the file holding the signer's private key. The *_key suffix is
// gitignored - never commit real keys.
export const PRIVATE_KEY_PATH = "./local-key/evm/private_key";
