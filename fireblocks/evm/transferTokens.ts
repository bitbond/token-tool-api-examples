import { TransactionOperation, TransferPeerPathType } from "@fireblocks/ts-sdk";
import { ethers } from "ethers";
import {
  ASSET_ID,
  fireblocksClient,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  VAULT_ID,
} from "./config";

// The token contract, decimals, vault, and client come from ./config. The knobs
// below are specific to transferring.
// The address of the recipient to transfer tokens to
const RECIPIENT_ADDRESS = "0x...";
// The amount of tokens to be sent
const AMOUNT_TO_TRANSFER = "1.0";

const fireblocksParams = {
  // Unique ID to ensure that the transaction is not run twice
  // https://developers.fireblocks.com/docs/creating-a-transaction#api-idempotency-best-practice
  externalTxId: "0123456",
  // Any string, will be visible in Fireblocks console
  note: "Tokens transfer",
  // Amount of native currency to send with the call
  amount: "0",
};

const TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

const fireblocks = fireblocksClient();


(async() => {
  // Initialize contract interface
  const contractInterface = new ethers.Interface(TRANSFER_ABI);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_TRANSFER, TOKEN_DECIMALS);
  const calldata = contractInterface.encodeFunctionData(
    "transfer",
    [RECIPIENT_ADDRESS, parsedAmount]
  );

  // Send the transaction to Fireblocks API
  const tx = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      operation: TransactionOperation.ContractCall,
      assetId: ASSET_ID,
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: VAULT_ID,
      },
      destination: {
        type: TransferPeerPathType.OneTimeAddress,
        oneTimeAddress: {
          address: TOKEN_ADDRESS,
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
