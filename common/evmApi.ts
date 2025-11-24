import { EVMTokenData } from "./types";

/**
 * Response type from the prepare-deployment API endpoint
 */
type PrepareDeploymentResponse = {
  bytecode: string;
  totalUSD: number;
  totalWei: bigint;
  baseUSD: number;
  baseWei: bigint;
  signature: string;
  salt: string;
  expiresAt: number;
};

/**
 * Calls the Bitbond Token Tool API to prepare a token deployment transaction
 * 
 * @param tokenData - The token configuration data
 * @param chainId - The chain ID for the network (e.g., 11155111 for Sepolia)
 * @param userAddress - The address that will deploy the token
 * @param contractName - Internal contract name used by Bitbond Token Tool API (e.g., "BitbondTokenToolAssetToken")
 * @param customContractName - Optional custom name for the contract (PascalCase, up to 64 characters)
 * @param discountCode - Optional discount code
 * @returns Deployment transaction data including bytecode, signature, salt, and pricing
 */
const prepareDeployTransaction = async (
  tokenData: EVMTokenData,
  chainId: number,
  userAddress: string,
  contractName: string,
  customContractName?: string,
  discountCode?: string
): Promise<PrepareDeploymentResponse> => {
  const payload = {
    chainId,
    constructorArgs: [
      tokenData.tokenName,
      tokenData.symbol,
      tokenData.initialSupply,
      tokenData.decimals,
      tokenData.owner,
      tokenData.tokenProps,
      tokenData.documentUri,
      tokenData.taxAddress,
      tokenData.bpsParams,
      tokenData.amountParams,
    ],
    contractName,
    customContractName,
    discountCode,
    userAddress,
  };

  const response = await fetch(
    "https://tokentool.bitbond.com/api/contract-utils/prepare-deployment",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to prepare deployment: ${response.statusText} - ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    data: {
      bytecode: string;
      totalUSD: number;
      totalWei: { type: string; hex: string };
      baseUSD: number;
      baseWei: { type: string; hex: string };
      signature: string;
      salt: string;
      expiresAt: number;
    };
  };

  // Convert ethers v5 BigNumber objects to native BigInt for ethers v6
  return {
    ...data.data,
    totalWei: BigInt(data.data.totalWei.hex),
    baseWei: BigInt(data.data.baseWei.hex),
  };
}

export type { PrepareDeploymentResponse };
export { prepareDeployTransaction };

