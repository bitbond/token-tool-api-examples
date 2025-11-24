type EVMTokenData = {
  tokenName: string;
  symbol: string;
  initialSupply: string;
  decimals: string;
  owner: string;
  tokenProps: {
    _isMintable: boolean;
    _isBurnable: boolean;
    _isPausable: boolean;
    _isBlacklistEnabled: boolean;
    _isDocumentAllowed: boolean;
    _isWhitelistEnabled: boolean;
    _isMaxSupplySet: boolean;
    _isMaxAmountOfTokensSet: boolean;
    _isForceTransferAllowed: boolean;
    _isTaxable: boolean;
    _isDeflationary: boolean;
  };
  documentUri: string;
  taxAddress: string;
  bpsParams: [number, number];
  amountParams: [string, string]
}

export type { EVMTokenData };
