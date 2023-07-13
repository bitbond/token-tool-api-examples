import { ethers } from "ethers";
import fs from "fs";

import tokenArtifact from "../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// Details of the token to be minted. Token should be deployed on-chain before minting
const token = {
  contractAddress: "0x...",
  decimals: 18 // The number of decimals the token uses
};
// The amount of tokens to be minted
const amount = "3.0";
// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control
const privateKey = fs.readFileSync("./private_key", "utf-8").trim();
// The RPC URL of EVM network to use, for example Polygon Mumbai testnet
const rpcUrl = "https://rpc-mumbai.maticvigil.com";
// The address the tokens will be transferred to during minting
const recipientAddress = "0x...";

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(
    token.contractAddress,
    tokenArtifact.abi,
    signer
  );

  // Parse amount of tokens to send taking into account the decimals
  const parsedAmount = ethers.utils.parseUnits(amount, token.decimals);

  // Call the contract's mint function
  const tx = await contract.mint(recipientAddress, parsedAmount);

  // Wait until transaction is mined
  await tx.wait();
  console.log(JSON.stringify(tx, null, 2));
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
