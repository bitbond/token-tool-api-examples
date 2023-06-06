// New token configuration
export const token = {
  name: "ABC-3 Token",
  symbol: "ABC-3",
  // Initial supply of tokens to be minted with token creation
  initialSupply: "100",
  // Number of decimals to be used by the token
  decimals: "18",
  // Owner address of deployed token contract.
  // It can be the address of vault account signing the transaction,
  // but it can also be any other address that will own the contract after creation.
  issuerAddress: "0x...",
  flags: {
    // Additional tokens can be minted after contract creation to increase supply
    _isMintable: false,
    // Token and all associated operations can be halted
    _isPausable: false,
    // Tokens can be burned after contract creation to decrease supply
    _isBurnable: false,
    // Addresses can be blacklisted by the owner,
    // preventing them from direct interaction with tokens
    _isBlacklistEnabled: false,
    // A hash or URI can be used to reference documentation of the asset
    // It can be updated after creation
    _isDocumentAllowed: false,
    // Token transfers are only possible to whitelisted addresses
    // or if the token is freely transferable.
    _isWhitelistEnabled: false,
    // Limit the number of tokens that an address can hold
    _isMaxAmountOfTokensSet: false,
    // Tokens can be force-transferred by the owner,
    // cannot be deactivated after creation
    _isForceTransferAllowed: false,
  },
  // If _isMaxAmountOfTokensSet is true,
  // this specifies the maximum number of tokens that an address can hold
  balanceLimit: 0,
  // If _isDocumentAllowed is true,
  // this specifies the document URI that can be updated by the owner
  documentUri: "",
};

export const fireblocksParams = {
  // Vault used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee
  // To set contract owner, use token.issuerAddress parameter.
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "MATIC_POLYGON_MUMBAI",
  // Any string
  note: "Deploying FullFeatureToken",
  // Should always be 0, amount of native currency to send with the call
  amount: "0"
};

// Provided by Bitbond
export const factoryAddress = "0x88777bcCb752B20245400049021CB47b8fbCf640";
