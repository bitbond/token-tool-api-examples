import { ethers } from "ethers";

import tokenArtifact from "../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// Details of the token to be minted. Token should be deployed on-chain before minting
const token = {
  contractAddress: "0x...",
  decimals: 18 // The number of decimals the token uses
};
// The amount of tokens to be minted
const amount = "3.0";
// The address the tokens will be transferred to during minting
const recipientAddress = "0x...";

(async () => {
  // Initialize contract interface
  const contractInterface = new ethers.utils.Interface(tokenArtifact.abi);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.utils.parseUnits(amount, token.decimals);
  const calldata = contractInterface.encodeFunctionData(
    "mint",
    [recipientAddress, parsedAmount]
  );
  console.log(`Calldata: ${calldata}`);
})().catch((e)=>{
  console.error(`Failed: ${e}`);
});
