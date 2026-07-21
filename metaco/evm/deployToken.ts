import { ethers } from "ethers";
import { EVMTokenData } from "../../common/types";
import { prepareDeployTransaction } from "../../common/evmApi";
import {
  CHAIN_ID,
  FACTORY_ADDRESS,
  ISSUER_ADDRESS,
  TOKEN_DECIMALS,
} from "./config";

// Network/token identifiers (CHAIN_ID, FACTORY_ADDRESS, ISSUER_ADDRESS,
// TOKEN_DECIMALS) come from ./config. The token configuration below is specific
// to deploying an asset.
const token: EVMTokenData = {
  // The name of the token
  tokenName: "ABC Token",
  // The symbol/ticker of the token
  symbol: "ABC",
  // The initial supply of tokens to be minted with token creation
  initialSupply: "100",
  // The number of decimals to be used by the token
  decimals: TOKEN_DECIMALS.toString(),
  // The owner address of the token contract.
  // Set to issuer address or any other address that will own the contract after creation.
  owner: ISSUER_ADDRESS,
  tokenProps: {
    // If true, the token can be minted after contract creation
    _isMintable: false,
    // If true, the token can be burned after contract creation
    _isBurnable: false,
    // if True, the token can be paused after contract creation
    _isPausable: false,
    // If true, the token will have address blacklist functionality after contract creation
    _isBlacklistEnabled: false,
    // If true, the token can have a document URI after contract creation
    _isDocumentAllowed: false,
    // If true, the token will have address whitelist functionality after contract creation
    _isWhitelistEnabled: false,
    // If true, the token will have a max supply after contract creation
    _isMaxSupplySet: false,
    // If true, the token will have a max amount of tokens per address after contract creation
    _isMaxAmountOfTokensSet: false,
    // If true, the token can be force-transferred by the owner after contract creation
    _isForceTransferAllowed: false,
    // If true, the token can be taxable on each transfer
    _isTaxable: false,
    // If true, the token can be deflationary on each transfer
    _isDeflationary: false,
  },
  // If _isDocumentAllowed is true, this specifies the document URI
  documentUri: "",
  // If _isTaxable is true, this specifies the address that will receive the tax
  taxAddress: ISSUER_ADDRESS,
  // If _isTaxable or _isDeflationary is true, this specifies the tax and deflation basis points
  bpsParams: [0, 0],
  // If _isMaxSupplySet or _isMaxAmountOfTokensSet is true, this specifies the max supply and max amount of tokens per address
  amountParams: ["0", "0"],
};

// Factory ABI - only the deployContract function we need
const FACTORY_ABI = [
  "function deployContract(bytes calldata bytecode, bytes calldata signature, uint256 _salt, uint40 expiresAt) external returns (address)"
];

(async () => {
  try {
    // Bitbond Token Tool contract name. Used internally by Bitbond Token Tool API
    const contractName = "BitbondTokenToolAssetToken";
    // Customize the name of the contract itself. Needs to be PascalCase and up to 64 characters
    // Defaults to contractName if undefined
    const customContractName = undefined;
    // If you have a discount code, you can set it here.
    // Defaults to undefined
    const discountCode = undefined;
    
    // Prepare deployment transaction via API
    console.log("Preparing token deployment via API...");
    const { bytecode, signature, salt, expiresAt, totalUSD, totalWei } = await prepareDeployTransaction(
      token,
      CHAIN_ID,
      ISSUER_ADDRESS,
      contractName,
      customContractName,
      discountCode
    );
    
    console.log(`Deployment cost: ${totalUSD} USD (${ethers.formatEther(totalWei)} ETH)`);

    // Initialize contract interface for factory
    const factoryInterface = new ethers.Interface(FACTORY_ABI);

    // Encode the factory's deployContract function call with all required parameters
    const calldata = factoryInterface.encodeFunctionData("deployContract", [
      bytecode,
      signature,
      salt,
      expiresAt,
    ]);

    console.log("\n=== Metaco Harmonize Integration ===");
    console.log("Factory Address:", FACTORY_ADDRESS);
    console.log("Transaction Data (Calldata):", calldata);
    console.log("Transaction Value (Wei):", totalWei.toString());
    console.log("\nUse the above data with Metaco Harmonize API:");
    console.log("1. Create a v0_CreateTransactionOrder intent");
    console.log("2. Set destination address to the Factory address");
    console.log("3. Set data to the Transaction Data (calldata)");
    console.log("4. Set value to the Transaction Value");
  } catch (e) {
    console.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
})().catch((e) => {
  console.error(`Unhandled error: ${e instanceof Error ? e.message : String(e)}`);
});
