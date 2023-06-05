import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { ethers, PopulatedTransaction } from "ethers";
import bitbondFactory from "../assets/CoinService.json";
import { Deferrable } from "@ethersproject/properties";
import type { ContractInterface, BytesLike, ContractFactory } from "ethers";
import tokenArtifact from "../assets/FullFeatureToken.json";
import fs from "fs";
import { token, fireblocksParams, factoryAddress } from "../config";

type ContractArtifact = {
  abi: ContractInterface;
  bytecode: BytesLike;
};

const fireblocks = () => {
  const fireblocksApiKey = fs.readFileSync(process.argv[2], "utf-8").trim();
  const fireblocksApiSecret = fs.readFileSync(process.argv[3], "utf-8").trim();

  if (!fireblocksApiKey || !fireblocksApiSecret) {
    throw new Error("Missing Fireblocks API key or secret");
  }
  return new FireblocksSDK(fireblocksApiSecret, fireblocksApiKey);
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
