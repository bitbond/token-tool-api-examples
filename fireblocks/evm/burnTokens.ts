import { BasePath, Fireblocks, TransactionOperation, TransferPeerPathType } from "@fireblocks/ts-sdk";
import { ethers } from "ethers";
import fs from "fs";

// Edit the values below according to your needs
// The address of the token contract to burn tokens from
const CONTRACT_ADDRESS = "0x...";
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "3.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;

const fireblocksParams = {
  // Vault ID that is used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee that owns the tokens
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "ETH_TEST5",
  // Unique ID to ensure that the transaction is not run twice
  // https://developers.fireblocks.com/docs/creating-a-transaction#api-idempotency-best-practice
  externalTxId: "012345",
  // Any string, will be visible in Fireblocks console
  note: "Burning tokens",
  // Amount of native currency to send with the call
  amount: "0",
};

const BURN_ABI = [
  "function burn(uint256 amount) external",
];

const fireblocks = new Fireblocks({
  apiKey: fs.readFileSync("./fireblocks/evm/fireblocks_api_key", "utf-8").trim(),
  basePath: BasePath.EU,
  secretKey: fs.readFileSync("./fireblocks/evm/fireblocks_private_key", "utf-8").trim()
});

(async() => {
  // Initialize contract interface
  const contractInterface = new ethers.Interface(BURN_ABI);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_BURN, TOKEN_DECIMALS);
  const calldata = contractInterface.encodeFunctionData(
    "burn",
    [parsedAmount]
  );

  // Send the transaction to Fireblocks API
  const tx = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      operation: TransactionOperation.ContractCall,
      assetId: fireblocksParams.assetId,
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: fireblocksParams.vaultId,
      },
      destination: {
        type: TransferPeerPathType.OneTimeAddress,
        oneTimeAddress: {
          address: CONTRACT_ADDRESS,
        },
      },
      note: fireblocksParams.note,
      amount: fireblocksParams.amount,
      externalTxId: fireblocksParams.externalTxId,
      extraParameters: {
        contractCallData: calldata,
      },
    }
  });

  console.log(JSON.stringify(tx, null, 2));
})().catch(error => {
  console.log(error);
});
