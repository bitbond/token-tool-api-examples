import { ethers, PopulatedTransaction } from "ethers";
import type { ContractInterface, BytesLike, ContractFactory } from "ethers";
import fs from "fs";

import bitbondFactory from "../assets/CoinService.json";
import tokenArtifact from "../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// New token configuration
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
  },
  // If _isMaxAmountOfTokensSet is true,
  // this specifies the maximum number of tokens that an address can hold
  balanceLimit: 0,
  // If _isDocumentAllowed is true,
  // this specifies the document URI that can be updated by the owner
  documentUri: "",
};
// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control
const privateKey = fs.readFileSync("./private_key", "utf-8").trim();
// The RPC URL of EVM network to use, for example Polygon Mumbai testnet
const rpcUrl = "https://rpc-mumbai.maticvigil.com";
// Value provided by Bitbond
const factoryAddress = "0x...";

type ContractArtifact = {
  abi: ContractInterface;
  bytecode: BytesLike;
};

const getBytecode =
  <T extends ContractFactory>({ abi, bytecode }: ContractArtifact) =>
    (...args: Parameters<T["deploy"]>) => {
      const factory = new ethers.ContractFactory(abi, bytecode);
      const deployTxBytecode = factory.getDeployTransaction(...args).data;
      if (!deployTxBytecode) {
        throw new Error("Bytecode for deployment not generated");
      }
      return deployTxBytecode;
    };

(async () => {
  const factoryContract = new ethers.Contract(factoryAddress, bitbondFactory.abi);

  const bytecode = getBytecode(tokenArtifact)(
    token.name,
    token.symbol,
    token.initialSupply,
    token.decimals,
    token.issuerAddress,
    token.flags,
    token.balanceLimit,
    token.documentUri
  );
  const tx: PopulatedTransaction =
    await factoryContract.populateTransaction.deployContract(bytecode);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const transaction = {
    to: factoryAddress,
    data: tx.data
  };

  // Send the transaction
  const result = await signer.sendTransaction(transaction);

  console.log(JSON.stringify(result, null, 2));
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
