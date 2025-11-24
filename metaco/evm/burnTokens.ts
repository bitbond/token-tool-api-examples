import { ethers } from "ethers";

// Edit the values below according to your needs
// The amount of tokens to be burned
const AMOUNT_TO_BURN = "1.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;

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
