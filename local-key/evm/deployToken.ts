import { ethers } from "ethers";
import fs from "fs";
import { EVMTokenData } from "../../common/types";
import { prepareDeployTransaction } from "../../common/evmApi";

// Edit the values below according to your needs
const ISSUER_ADDRESS = "0x...";
// Factory address for the network you are using
// Address of the factory contract for the network you are using
// Can be found in the Bitbond Token Tool documentation
const FACTORY_ADDRESS = "0x4904Ba3148147D2f78b05a8446C01c48a7ABa4bd";
// Chain ID for Ethereum Sepolia Testnet
// Should be updated to the correct chain ID for the network you are using
// Supported networks can be found in the Bitbond Token Tool documentation
const CHAIN_ID = 11155111;

// Token configuration: Edit values below according to your needs
const token: EVMTokenData = {
  // The name of the token
  tokenName: "ABC Token",
  // The symbol/ticker of the token
  symbol: "ABC",
  // The initial supply of tokens to be minted with token creation
  initialSupply: "100",
  // The number of decimals to be used by the token
  decimals: "18",
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
  // The document URI of the token. Can be updated after contract creation
  // Leave empty if _isDocumentAllowed is false
  documentUri: "",
  // The address that will receive tax on each transfer. Can be updated after contract creation
  // Set to owner address if _isTaxable is false
  taxAddress: ISSUER_ADDRESS,
  // The tax BPS and deflation BPS. The first value is the tax BPS and the second value is the deflation BPS
  // Can be updated after contract creation
  // Default to zero if _isTaxable or _isDeflationary is false
  // Cannot be more than 10000
  bpsParams: [0, 0],
  // The balance limit per address and the total supply limit. The first value is the balance limit per address and the second value is the total supply limit
  // Can be updated after contract creation
  // Default to zero if _isMaxAmountOfTokensSet is false and _isMaxSupplySet is false
  amountParams: ["0", "0"],
};

// Private key of the account that will sign the transaction
// Should be kept secret and never be committed to version control. Keep it in a secure location.
const privateKey = fs.readFileSync("./local-key/evm/private_key", "utf-8").trim();
// The RPC URL of EVM network to use, for example Ethereum Sepolia Testnet
const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";

// Factory ABI - only the deployContract function we need
const FACTORY_ABI = [
  "function deployContract(bytes calldata bytecode, bytes calldata signature, uint256 _salt, uint40 expiresAt) external returns (address)"
];

void (async () => {
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

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Prepare transaction with value (deployment cost)
    const transaction = {
      to: FACTORY_ADDRESS,
      data: calldata,
      value: totalWei
    };

    // Send the transaction
    console.log("Sending deployment transaction...");
    const result = await signer.sendTransaction(transaction);

    console.log("Token deployment transaction sent successfully!");
    console.log("Transaction hash:", result.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await result.wait();
    console.log("Transaction confirmed!");
    console.log("Block number:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed.toString());
  } catch (e: unknown) {
    console.error("Failed:", e);
  }
})();
