import { ethers } from "ethers";
import fs from "fs";

// Edit the values below according to your needs
// The address of the token contract to burn tokens from
const CONTRACT_ADDRESS = "0x...";
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "1.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;

// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control. Keep it in a secure location.
const privateKey = fs.readFileSync("./local-key/evm/private_key", "utf-8").trim();
// The RPC URL of EVM network to use, for example Ethereum Sepolia Testnet
const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";

const BURN_ABI = [
  "function burn(uint256 amount) external",
];

(async () => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, BURN_ABI, signer);

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
