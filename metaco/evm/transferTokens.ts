import { ethers } from "ethers";
import { TOKEN_DECIMALS } from "./config";

// TOKEN_DECIMALS comes from ./config. The knobs below are specific to transferring.
// The amount of tokens to be sent
const AMOUNT_TO_TRANSFER = "1.0";
// The address the tokens will be transferred to
const RECIPIENT_ADDRESS = "0x...";

const TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

(() => {
  try {
    // Initialize contract interface
    const contractInterface = new ethers.Interface(TRANSFER_ABI);

    // Encode function and parameters to be used as calldata
    const parsedAmount = ethers.parseUnits(AMOUNT_TO_TRANSFER, TOKEN_DECIMALS);
    const calldata = contractInterface.encodeFunctionData(
      "transfer",
      [RECIPIENT_ADDRESS, parsedAmount]
    );
    console.log(`Calldata: ${calldata}`);
  } catch (e) {
    console.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
})();
