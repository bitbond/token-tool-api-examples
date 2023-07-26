import { FireblocksWeb3Provider, ChainId } from "@fireblocks/fireblocks-web3-provider";
import { ethers } from "ethers";
import fs from "fs";
import tokenArtifact from "../../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// Details of the token to be transferred
const token = {
  contractAddress: "0x...",
  decimals: 18 // The number of decimals the token uses
};
// The amount of tokens to be sent
const amount = "1.0";
// The address the tokens will be transferred to
const recipientAddress = "0x...";
// Chain ID of the network to use
const chainId = ChainId.POLYGON_TEST;
// Vault account ID that will be used to sign the transaction
const vaultAccountId = 0;

const eip1193Provider = new FireblocksWeb3Provider({
  privateKey: "./fireblocks_private_key",
  apiKey: fs.readFileSync("./fireblocks_api_key", "utf-8").trim(),
  vaultAccountIds: [vaultAccountId],
  chainId: chainId,
});

(async() => {
  const provider = new ethers.providers.Web3Provider(eip1193Provider);
  const myContract = new ethers.Contract(token.contractAddress, tokenArtifact["abi"], provider.getSigner());
  const parsedAmount = ethers.utils.parseUnits(amount, token.decimals);

  // Invoke the transfer function
  const tx = await myContract.transfer(recipientAddress, parsedAmount);

  console.log(JSON.stringify(tx, null, 2));

})().catch(error => {
  console.log(error);
});
