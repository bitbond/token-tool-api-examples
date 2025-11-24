import { FireblocksWeb3Provider, ChainId } from "@fireblocks/fireblocks-web3-provider";
import { ethers, Eip1193Provider } from "ethers";
import fs from "fs";

// Edit the values below according to your needs
// The address of the token contract to transfer tokens from
const CONTRACT_ADDRESS = "0x...";
// The address of the recipient to transfer tokens to
const RECIPIENT_ADDRESS = "0x...";
// The amount of tokens to be sent
const AMOUNT_TO_TRANSFER = "1.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;

const TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

// Chain ID of the network to use
const chainId = ChainId.SEPOLIA;
// Vault account ID that will be used to sign the transaction
const vaultAccountId = 0;

const eip1193Provider = new FireblocksWeb3Provider({
  privateKey: fs.readFileSync("../fireblocks_private_key", "utf-8").trim(),
  apiKey: fs.readFileSync("../fireblocks_api_key", "utf-8").trim(),
  vaultAccountIds: [vaultAccountId],
  chainId: chainId,
});

(async() => {
  const provider = new ethers.BrowserProvider(eip1193Provider as Eip1193Provider);
  const signer = await provider.getSigner();
  const myContract = new ethers.Contract(CONTRACT_ADDRESS, TRANSFER_ABI, signer);
  const parsedAmount = ethers.parseUnits(AMOUNT_TO_TRANSFER, TOKEN_DECIMALS);

  // Invoke the transfer function
  const tx = await myContract.transfer(RECIPIENT_ADDRESS, parsedAmount);

  console.log(JSON.stringify(tx, null, 2));

})().catch(error => {
  console.log(error);
});
