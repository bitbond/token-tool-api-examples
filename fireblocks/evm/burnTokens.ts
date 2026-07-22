import { TransactionOperation, TransferPeerPathType } from "@fireblocks/ts-sdk";
import { ethers } from "ethers";
import {
  ASSET_ID,
  fireblocksClient,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  VAULT_ID,
} from "./config";

// The token contract, decimals, vault, and client come from ./config. The knob
// below is specific to burning.
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "3.0";

const fireblocksParams = {
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

const fireblocks = fireblocksClient();

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
