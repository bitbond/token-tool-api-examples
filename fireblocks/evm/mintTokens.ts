import { BasePath, Fireblocks, TransactionOperation, TransferPeerPathType } from "@fireblocks/ts-sdk";
import { ethers } from "ethers";
import fs from "fs";

// Edit the values below according to your needs
// The address of the token contract to mint tokens from
const CONTRACT_ADDRESS = "0x...";
// The address of the recipient to mint tokens to
const RECIPIENT_ADDRESS = "0x...";
// The amount of tokens to be minted
const AMOUNT_TO_MINT = "3.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;

const fireblocksParams = {
  // Vault ID that is used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "ETH_TEST5",
  // Unique ID to ensure that the transaction is not run twice
  // https://developers.fireblocks.com/docs/creating-a-transaction#api-idempotency-best-practice
  externalTxId: "01234",
  // Any string, will be visible in Fireblocks console
  note: "Minting tokens",
  // Amount of native currency to send with the call
  amount: "0",
};

const fireblocks = new Fireblocks({
  apiKey: fs.readFileSync("./fireblocks/evm/fireblocks_api_key", "utf-8").trim(),
  basePath: BasePath.EU,
  secretKey: fs.readFileSync("./fireblocks/evm/fireblocks_private_key", "utf-8").trim()
});

const MINT_ABI = [
  "function mint(address to, uint256 amount) external",
];

(async() => {
  // Initialize contract interface
  const contractInterface = new ethers.Interface(MINT_ABI);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_MINT, TOKEN_DECIMALS);
  const calldata = contractInterface.encodeFunctionData(
    "mint",
    [RECIPIENT_ADDRESS, parsedAmount]
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
    },
  });

  console.log(JSON.stringify(tx, null, 2));
})().catch(error => {
  console.log(error);
});
