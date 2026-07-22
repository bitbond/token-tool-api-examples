import { ethers } from "ethers";
import { TOKEN_DECIMALS } from "./config";

// TOKEN_DECIMALS comes from ./config. The knob below is specific to burning.
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "1.0";

const BURN_ABI = [
  "function burn(uint256 amount) external",
];

(() => {
  try {
    // Initialize contract interface
    const contractInterface = new ethers.Interface(BURN_ABI);

    // Encode function and parameters to be used as calldata
    const parsedAmount = ethers.parseUnits(AMOUNT_TO_BURN, TOKEN_DECIMALS);
    const calldata = contractInterface.encodeFunctionData(
      "burn",
      [parsedAmount]
    );
    console.log(`Calldata: ${calldata}`);
  } catch (e) {
    console.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
})();
