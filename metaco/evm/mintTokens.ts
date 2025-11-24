import { ethers } from "ethers";

// Edit the values below according to your needs
// The amount of tokens to be minted
const AMOUNT_TO_MINT = "3.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;
// The address the tokens will be transferred to during minting
const RECIPIENT_ADDRESS = "0x...";

const MINT_ABI = [
  "function mint(address to, uint256 amount) external",
];

(() => {
  try {
    // Initialize contract interface
    const contractInterface = new ethers.Interface(MINT_ABI);

    // Encode function and parameters to be used as calldata
    const parsedAmount = ethers.parseUnits(AMOUNT_TO_MINT, TOKEN_DECIMALS);
    const calldata = contractInterface.encodeFunctionData(
      "mint",
      [RECIPIENT_ADDRESS, parsedAmount]
    );
    console.log(`Calldata: ${calldata}`);
  } catch (e) {
    console.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
})();
