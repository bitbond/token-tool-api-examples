import { ethers } from "ethers";
import fs from "fs";
import {
  PRIVATE_KEY_PATH,
  RPC_URL,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
} from "./config";

// The token contract, decimals, RPC, and signer key come from ./config. The
// knob below is specific to burning.
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "1.0";

// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control. Keep it in a secure location.
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8").trim();

const BURN_ABI = [
  "function burn(uint256 amount) external",
];

(async () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(TOKEN_ADDRESS, BURN_ABI, signer);

  // Parse amount of tokens to send taking into account the decimals
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_BURN, TOKEN_DECIMALS);

  // Call the contract's burn function
  const tx = await contract.burn(parsedAmount);

  // Wait until transaction is mined
  await tx.wait();
  console.log(JSON.stringify(tx, null, 2));
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
