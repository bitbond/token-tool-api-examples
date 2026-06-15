/**
 * Helpers for verifying a deployed Bitbond Token Tool contract on a block
 * explorer (e.g. Etherscan, Routescan).
 *
 * Verification publishes the contract's source code on the block explorer so it
 * shows up as "verified". These helpers wrap the Bitbond Token Tool `multiscan`
 * API, which handles the verification request for you. No API key is required.
 */

// Bitbond Token Tool multiscan endpoint
const MULTISCAN_URL = "https://tokentool.bitbond.com/api/multiscan";

/**
 * Block explorer to verify on. Use the default explorer for the network you
 * deployed to (e.g. "etherscan" for Ethereum/Sepolia). Supported networks and
 * their default explorers can be found in the Bitbond Token Tool documentation.
 */
type ExplorerName = "etherscan" | "routescan";

// Branding the token was created with. Tokens created with the default settings
// carry the standard Bitbond branding.
const SERVICES = "withBitbondBranding";

type MultiscanResponse<T> = {
  success: boolean;
  data: T;
};

type ExplorerApiResponse = {
  status: string;
  message: string;
  result: string;
};

type CreationTransactionResponse = {
  blockNumber: number;
  from: string;
  hash?: string;
  transactionHash?: string;
};

/**
 * POST a named call to the multiscan endpoint and return its payload.
 */
const callMultiscan = async <T>(
  name: string,
  params: Record<string, unknown>
): Promise<T> => {
  const response = await fetch(MULTISCAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, params }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `multiscan "${name}" failed: ${response.statusText} - ${errorBody}`
    );
  }

  const json = (await response.json()) as MultiscanResponse<T>;
  return json.data;
};

/**
 * Look up the transaction that created the token contract.
 */
const getCreationTransactionHash = async ({
  chainId,
  address,
  explorerName,
}: {
  chainId: number;
  address: string;
  explorerName: ExplorerName;
}): Promise<string> => {
  const data = await callMultiscan<CreationTransactionResponse>(
    "getCreationTransactionHash",
    { chainId, address, explorerName }
  );

  const creationTxHash = data.hash ?? data.transactionHash;
  if (!creationTxHash) {
    throw new Error("No creation transaction hash returned by the API");
  }

  return creationTxHash;
};

/**
 * Submit a verification request. Returns the GUID used to poll for the result.
 */
const submitVerification = async (params: {
  contractName: string;
  chainId: number;
  contractAddress: string;
  customContractName: string;
  creationTxHash: string;
  contractHash: string;
  explorerName: ExplorerName;
}): Promise<string> => {
  const data = await callMultiscan<ExplorerApiResponse>("verifyContract", {
    ...params,
    services: SERVICES,
  });

  const guid = data.result;
  if (!guid) {
    throw new Error(
      `Verification request did not return a GUID: ${JSON.stringify(data)}`
    );
  }

  return guid;
};

/**
 * Poll the verification status until the explorer reports success or failure.
 * Verification can stay pending for a short while after submission, so this
 * retries a number of times with a fixed delay.
 */
const pollVerificationStatus = async ({
  chainId,
  guid,
  explorerName,
  maxAttempts = 20,
  delayMs = 5000,
}: {
  chainId: number;
  guid: string;
  explorerName: ExplorerName;
  maxAttempts?: number;
  delayMs?: number;
}): Promise<ExplorerApiResponse> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await callMultiscan<ExplorerApiResponse>(
        "checkVerifyStatus",
        { chainId, guid, explorerName }
      );

      if (data.status === "1") {
        return data;
      }

      throw new Error(data.result || "Verification failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isPending = message.includes("Pending");

      if (!isPending || attempt === maxAttempts) {
        throw new Error(`Verification not completed: ${message}`);
      }

      console.log(
        `Verification still pending (attempt ${attempt}/${maxAttempts}), retrying in ${
          delayMs / 1000
        }s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Verification did not complete within the allotted attempts");
};

export type { ExplorerName, ExplorerApiResponse };
export {
  getCreationTransactionHash,
  submitVerification,
  pollVerificationStatus,
};
