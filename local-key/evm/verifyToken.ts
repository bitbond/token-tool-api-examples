import { ethers } from "ethers";
import {
  ExplorerName,
  getCreationTransactionHash,
  submitVerification,
  pollVerificationStatus,
} from "../../common/verifyApi";

// Edit the values below according to your needs

// Address of the token contract you want to verify.
// This is the deployed token address, which deployToken.ts prints on success.
const CONTRACT_ADDRESS = "0x...";

// Chain ID of the network the token was deployed to.
// Should match the CHAIN_ID used in deployToken.ts (11155111 = Sepolia Testnet).
// Supported networks can be found in the Bitbond Token Tool documentation.
const CHAIN_ID = 11155111;

// Source contract name of the deployed token. The default token deployed by
// deployToken.ts uses "FullFeatureTokenV2".
const contractName = "FullFeatureTokenV2";

// Block explorer to verify the contract on. Use the default explorer for your
// network ("etherscan" for Ethereum/Sepolia).
const explorerName: ExplorerName = "etherscan";

// The RPC URL of the EVM network the token lives on, for example Ethereum
// Sepolia Testnet.
const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";

// Minimal ABI to read the contract name and hash from the deployed token.
const CONTRACT_METADATA_ABI = [
  "function CONTRACT_NAME() view returns (string)",
  "function CONTRACT_HASH() view returns (bytes32)",
];

// Fallback contract hash, used if the contract does not expose CONTRACT_HASH().
const DEFAULT_HASH =
  "0xdda569585d4bb5cc8e88c90273678c18c205753fede4bd06db5c292996bda994";

void (async () => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_METADATA_ABI,
      provider
    );

    console.log("Reading contract details...");
    const customContractName: string = await contract
      .CONTRACT_NAME()
      .catch(() => contractName);
    const contractHash: string = await contract
      .CONTRACT_HASH()
      .catch(() => DEFAULT_HASH);

    console.log("Resolving creation transaction...");
    const creationTxHash = await getCreationTransactionHash({
      chainId: CHAIN_ID,
      address: CONTRACT_ADDRESS,
      explorerName,
    });

    console.log("Submitting verification request...");
    const guid = await submitVerification({
      contractName,
      chainId: CHAIN_ID,
      contractAddress: CONTRACT_ADDRESS,
      customContractName,
      creationTxHash,
      contractHash,
      explorerName,
    });
    console.log("Verification request submitted. GUID:", guid);

    console.log("Waiting for verification result...");
    const result = await pollVerificationStatus({
      chainId: CHAIN_ID,
      guid,
      explorerName,
    });

    console.log("Contract verified successfully!");
    console.log("Status:", result.result);
  } catch (e: unknown) {
    console.error("Failed:", e);
  }
})();
