import { ethers } from "ethers";
import { TOKEN_DECIMALS } from "./config";

// TOKEN_DECIMALS comes from ./config. The knobs below are specific to minting.
// The amount of tokens to be minted
const AMOUNT_TO_MINT = "3.0";
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
