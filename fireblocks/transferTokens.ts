import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { ethers } from "ethers";
import fs from "fs";
import tokenArtifact from "../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// Details of the token to be transferred
const token = {
  contractAddress: "0x...",
  decimals: 18 // The number of decimals the token uses
};
// The amount of tokens to transfer
const amount = "1.0";
// The address which will receive transferred tokens
const recipientAddress = "0x...";

const fireblocksParams = {
  // Vault ID that is used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee and owns the tokens
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "MATIC_POLYGON_MUMBAI",
  // Unique ID to ensure that the transaction is not run twice
  // https://developers.fireblocks.com/docs/creating-a-transaction#api-idempotency-best-practice
  externalTxId: "0123456",
  // Any string, will be visible in Fireblocks console
  note: "Tokens transfer",
};

const fireblocks = () => {
  const fireblocksApiKey = fs.readFileSync("./fireblocks_api_key", "utf-8").trim();
  const fireblocksPrivateKey = fs.readFileSync("./fireblocks_private_key", "utf-8").trim();

  if (!fireblocksApiKey || !fireblocksPrivateKey) {
    throw new Error("Missing Fireblocks API key or secret");
  }
  return new FireblocksSDK(fireblocksPrivateKey, fireblocksApiKey);
};

(async() => {
  // Initialize contract interface
  const contractInterface = new ethers.utils.Interface(tokenArtifact.abi);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.utils.parseUnits(amount, token.decimals);
  const calldata = contractInterface.encodeFunctionData(
    "transfer",
    [recipientAddress, parsedAmount]
  );

  // Send the transaction to Fireblocks API
  const tx = await fireblocks().createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: fireblocksParams.assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: fireblocksParams.vaultId,
    },
    destination: {
      type: PeerType.ONE_TIME_ADDRESS,
      oneTimeAddress: {
        address: token.contractAddress,
      },
    },
    note: fireblocksParams.note,
    amount: "0", // Amount of native currency to send with the call
    externalTxId: fireblocksParams.externalTxId,
    extraParameters: {
      contractCallData: calldata,
    },
  });

  console.log(JSON.stringify(tx, null, 2));
})().catch(error => {
  console.log(error);
});
