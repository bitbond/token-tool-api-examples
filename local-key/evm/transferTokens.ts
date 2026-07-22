import { ethers } from "ethers";
import fs from "fs";
import {
  PRIVATE_KEY_PATH,
  RPC_URL,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
} from "./config";

// The token contract, decimals, RPC, and signer key come from ./config. The
// knobs below are specific to transferring.
// The address of the recipient to transfer tokens to
const RECIPIENT_ADDRESS = "0x...";
// The amount of tokens to be sent
const AMOUNT_TO_TRANSFER = "1.0";

// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control. Keep it in a secure location.
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8").trim();

const TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(TOKEN_ADDRESS, TRANSFER_ABI, signer);

  // Parse amount of tokens to send taking into account the decimals
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_TRANSFER, TOKEN_DECIMALS);

  // Call the contract's transfer function
  const tx = await contract.transfer(RECIPIENT_ADDRESS, parsedAmount);

  // Wait until transaction is mined
  await tx.wait();
  console.log(JSON.stringify(tx, null, 2));
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
