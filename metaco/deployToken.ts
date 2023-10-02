import { ethers, PopulatedTransaction } from "ethers";

import bitbondFactory from "../assets/BitbondFactory.json";
import tokenArtifact from "../assets/FullFeatureToken.json";

// New token configuration: edit values below according to your needs
export const token = {
  name: "ABC-0 Token",
  symbol: "ABC-0",
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
    _isMintable: true,
    // Token and all associated operations can be halted
    _isPausable: true,
    // Tokens can be burned after contract creation to decrease supply
    _isBurnable: true,
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
    // If activated, the specified portion of a token transfer will go to the
    // specified tax / fee wallet. Cannot be deactivated after initial token creation.
    _isTaxable: false,
    // If activated, the specified portion of a token will be burnt at each
    // transfer. Cannot be deactivated after initial token creation.
    _isDeflationary: false,
  },
  // If _isMaxAmountOfTokensSet is true,
  // this specifies the maximum number of tokens that an address can hold
  balanceLimit: 0,
  // If _isDocumentAllowed is true,
  // this specifies the document URI that can be updated by the owner
  documentUri: "",
  // If _isTaxable is true, this specifies the address that will receive the tax
  txTaxAddress: "0x0000000000000000000000000000000000000000",
  // If _isTaxable is true, this specifies the tax amount in basis points
  taxBPS: 0,
  // If _isDeflationary is true, this specifies the burn rate in basis points
  deflationBPS: 0,
};

(async () => {
  // Initialize contract and factory objects
  const dummyAddress = "0x0000000000000000000000000000000000000000";
  const factoryContract = new ethers.Contract(dummyAddress, bitbondFactory.abi);
  const factory = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode);

  // Arrange the parameters for the token contract creation and get the bytecode
  const tokenParams = [
    token.name,
    token.symbol,
    token.initialSupply,
    token.decimals,
    token.issuerAddress,
    token.flags,
    token.balanceLimit,
    token.documentUri,
    token.txTaxAddress,
    token.taxBPS,
    token.deflationBPS,
  ];
  const bytecode = factory.getDeployTransaction(...tokenParams).data;
  // Create a transaction object based on the bytecode
  const tx: PopulatedTransaction =
    await factoryContract.populateTransaction.deployContract(bytecode);
  console.log("Transaction data:");
  console.log(tx.data);
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
