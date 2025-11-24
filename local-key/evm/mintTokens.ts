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

// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control. Keep it in a secure location.
const privateKey = fs.readFileSync("./local-key/evm/private_key", "utf-8").trim();
// The RPC URL of EVM network to use, for example Ethereum Sepolia Testnet
const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";

const MINT_ABI = [
  "function mint(address to, uint256 amount) external",
];

(async () => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, MINT_ABI, signer);

  // Parse amount of tokens to send taking into account the decimals
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_MINT, TOKEN_DECIMALS);

  // Call the contract's mint function
  const tx = await contract.mint(RECIPIENT_ADDRESS, parsedAmount);

  // Wait until transaction is mined
  await tx.wait();
  console.log(JSON.stringify(tx, null, 2));
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
