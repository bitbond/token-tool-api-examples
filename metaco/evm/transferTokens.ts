import { ethers } from "ethers";

// Edit the values below according to your needs
// The amount of tokens to be sent
const AMOUNT_TO_TRANSFER = "1.0";
// The number of decimals the token uses
const TOKEN_DECIMALS = 18;
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
