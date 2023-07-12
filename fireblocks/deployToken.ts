import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import bitbondFactory from "../assets/CoinService.json";
import { Deferrable } from "@ethersproject/properties";
import type { ContractInterface, BytesLike, ContractFactory } from "ethers";
import tokenArtifact from "../assets/FullFeatureToken.json";
import fs from "fs";

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

export const fireblocksParams = {
  // Vault ID that is used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee
  // To transfer ownership of contract on its creation use token.issuerAddress
  // parameter.
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "MATIC_POLYGON_MUMBAI",
  // Any string
  note: "Deploying token",
  // Should always be 0, amount of native currency to send with the call
  amount: "0"
};

// Provided by Bitbond
export const factoryAddress = "0x88777bcCb752B20245400049021CB47b8fbCf640";

type ContractArtifact = {
  abi: ContractInterface;
  bytecode: BytesLike;
};

const fireblocks = () => {
  const fireblocksApiKey = fs.readFileSync("./fireblocks_api_key", "utf-8").trim();
  const fireblocksPrivateKey = fs.readFileSync("./fireblocks_private_key", "utf-8").trim();

  if (!fireblocksApiKey || !fireblocksPrivateKey) {
    throw new Error("Missing Fireblocks API key or secret");
  }
  return new FireblocksSDK(fireblocksPrivateKey, fireblocksApiKey);
};

const getBytecode =
  <T extends ContractFactory>({ abi, bytecode }: ContractArtifact) =>
    (...args: Parameters<T["deploy"]>) => {
      const factory = new ethers.ContractFactory(abi, bytecode);
      const deployTxBytecode = factory.getDeployTransaction(...args).data;
      if (!deployTxBytecode) {
        throw new Error("Bytecode for deploy not generated!");
      }
      return deployTxBytecode;
    };

const processTransaction = async (
  tx: Deferrable<PopulatedTransaction>
) => {
  const res = await fireblocks().createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: fireblocksParams.assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: fireblocksParams.vaultId,
    },
    destination: {
      type: PeerType.ONE_TIME_ADDRESS,
      oneTimeAddress: {
        address: factoryAddress,
      },
    },
    note: fireblocksParams.note,
    amount: fireblocksParams.amount,
    extraParameters: {
      contractCallData: tx.data,
    },
  });

  console.log("Waiting for the transaction to be signed");
  console.log(`Transaction ${res.id} has been broadcasted.`);
};

(async () => {
  const factoryContract = new ethers.Contract(
    factoryAddress,
    bitbondFactory.abi
  );

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

  await processTransaction(tx);
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
