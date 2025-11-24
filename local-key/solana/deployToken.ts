import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const PINATA_JWT = "changeMe"; // Replace with your Pinata JWT token
const PRIVATE_WALLET_KEY = "changeMe"; // Replace with your wallet's private key (base58)

// Image configuration - Either IMAGE_FILE_NAME or IMAGE_URL must be defined
const IMAGE_FILE_NAME = ""; // Set to your local image filename (e.g., "token.png") to upload to Pinata
const IMAGE_URL = ""; // Replace with an already uploaded image URL (used if IMAGE_FILE_NAME is empty)

// Token configuration
const SAMPLE_TOKEN = {
  chainId: "solana-devnet" as "solana" | "solana-devnet", // "solana" for mainnet, "solana-devnet" for devnet
  tokenName: "My Token",
  symbol: "MTK",
  initialSupply: "1000000",
  decimals: "9",
  description: "This is my awesome token",
  revokeMintAuthority: false,
  setFreezeAuthority: false,
  revokeUpdateAuthority: false,
  x: "https://x.com/mytoken",
  telegram: "https://t.me/mytoken",
  website: "https://mytoken.com",
  discord: "https://discord.gg/mytoken",
  tags: "defi,token",
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TokenData {
  chainId: "solana" | "solana-devnet";
  tokenName: string;
  symbol: string;
  initialSupply: string;
  decimals: string;
  owner: string;
  imageUrl?: string;
  description?: string;
  x?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  tags?: string;
  revokeMintAuthority: boolean;
  setFreezeAuthority: boolean;
  revokeUpdateAuthority: boolean;
}

type BuildAndExecuteTokenTransactionResponse = {
  signature: string;
  mintPublicKey: string;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function: Signs and sends a transaction with private key
async function sendTransaction(
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  keypair: Keypair,
  options?: { skipPreflight?: boolean; maxRetries?: number }
): Promise<string> {
  // Sign transaction with keypair (partial sign to keep existing signatures)
  if (transaction instanceof Transaction) {
    transaction.partialSign(keypair);
  } else {
    transaction.sign([keypair]);
  }

  // Send signed transaction with requireAllSignatures: false to allow partially signed tx
  const rawTransaction = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: options?.skipPreflight ?? false,
    maxRetries: options?.maxRetries ?? 3,
  });

  return signature;
}

// Helper function: Loads an image file from the filesystem
function loadImageFile(imagePath: string): File | undefined {
  if (!fs.existsSync(imagePath)) {
    console.warn(`Image file not found: ${imagePath}`);
    return undefined;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const imageBlob = new Blob([new Uint8Array(imageBuffer)], {
    type: "image/png",
  });
  const imageFile = new File([imageBlob], path.basename(imagePath), {
    type: "image/png",
  });

  return imageFile;
}

// Helper function: Uploads an image file to Pinata IPFS
async function uploadImageToPinata(imageFile: File): Promise<string> {
  const pinataFormData = new FormData();
  pinataFormData.append("file", imageFile);

  const pinataResponse = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    }
  );

  if (!pinataResponse.ok) {
    throw new Error(`Pinata upload failed: ${pinataResponse.statusText}`);
  }

  const pinataData = await pinataResponse.json() as { IpfsHash: string };
  return `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;
}

// Helper function: Builds transaction via API and executes it on-chain
async function buildAndExecuteTokenTransaction(
  formData: TokenData,
  connection: Connection,
  keypair: Keypair
): Promise<BuildAndExecuteTokenTransactionResponse> {
  const publicKey = keypair.publicKey;

  // Prepare owner address
  const ownerAddress: string =
    formData.owner && formData.owner.trim() !== ""
      ? formData.owner
      : publicKey.toString();

  // Call Next.js API to build transaction
  const apiResponse = await fetch(
    "https://tokentool.bitbond.com/sol/api/build-token-tx",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId: formData.chainId,
        tokenName: formData.tokenName,
        symbol: formData.symbol,
        initialSupply: formData.initialSupply,
        decimals: formData.decimals,
        owner: ownerAddress,
        imageUrl: formData.imageUrl,
        description: formData.description,
        revokeMintAuthority: formData.revokeMintAuthority,
        setFreezeAuthority: formData.setFreezeAuthority,
        revokeUpdateAuthority: formData.revokeUpdateAuthority,
        x: formData.x,
        telegram: formData.telegram,
        website: formData.website,
        discord: formData.discord,
        tags: formData.tags,
      }),
    }
  );

  if (!apiResponse.ok) {
    throw new Error(
      `Failed to build token transaction: ${apiResponse.statusText}`
    );
  }

  const apiData = await apiResponse.json() as {
    data: {
      serializedTx: string;
      blockhash: string;
      lastValidBlockHeight: number;
      mintPublicKey: string;
    };
  };

  const { serializedTx, blockhash, lastValidBlockHeight, mintPublicKey } =
    apiData.data;

  // Deserialize transaction from base64
  const txBuffer: Buffer = Buffer.from(serializedTx, "base64");
  const transaction: Transaction = Transaction.from(txBuffer);

  // Send transaction to the blockchain using custom sendTransaction
  const signature: string = await sendTransaction(
    transaction,
    connection,
    keypair,
    {
      skipPreflight: false,
      maxRetries: 5,
    }
  );

  // Confirm transaction
  const confirmationStrategy = {
    signature,
    blockhash,
    lastValidBlockHeight,
  };

  const confirmation = await connection.confirmTransaction(
    confirmationStrategy,
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new Error(
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }

  return {
    signature,
    mintPublicKey,
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

// Main function: Creates a Solana SPL token with all configurations
async function createToken() {
  // Load wallet from private key
  const keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_WALLET_KEY));

  // Determine image URL based on configuration
  let imageUrl = "";

  if (IMAGE_FILE_NAME && IMAGE_FILE_NAME !== "") {
    const imagePath = path.join(__dirname, IMAGE_FILE_NAME);
    const imageFile = loadImageFile(imagePath);

    if (imageFile) {
      imageUrl = await uploadImageToPinata(imageFile);
    } else {
      throw new Error(`Failed to load image file: ${String(IMAGE_FILE_NAME)}`);
    }
  } else if (IMAGE_URL && IMAGE_URL !== "") {
    imageUrl = IMAGE_URL;
  } else {
    // No valid image configuration
    throw new Error(
      "Either IMAGE_FILE_NAME or IMAGE_URL must be properly configured"
    );
  }

  // Prepare form data using config
  const formData: TokenData = {
    chainId: SAMPLE_TOKEN.chainId,
    tokenName: SAMPLE_TOKEN.tokenName,
    symbol: SAMPLE_TOKEN.symbol,
    initialSupply: SAMPLE_TOKEN.initialSupply,
    decimals: SAMPLE_TOKEN.decimals,
    owner: keypair.publicKey.toString(),
    imageUrl: imageUrl,
    description: SAMPLE_TOKEN.description,
    revokeMintAuthority: SAMPLE_TOKEN.revokeMintAuthority,
    setFreezeAuthority: SAMPLE_TOKEN.setFreezeAuthority,
    revokeUpdateAuthority: SAMPLE_TOKEN.revokeUpdateAuthority,
    x: SAMPLE_TOKEN.x,
    telegram: SAMPLE_TOKEN.telegram,
    website: SAMPLE_TOKEN.website,
    discord: SAMPLE_TOKEN.discord,
    tags: SAMPLE_TOKEN.tags,
  };

  // Initialize connection based on chainId
  const rpcUrl =
    formData.chainId === "solana"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  try {
    const result = await buildAndExecuteTokenTransaction(
      formData,
      connection,
      keypair
    );

    console.log("Token created successfully!");
    console.log("Transaction signature:", result.signature);
    console.log("Mint address:", result.mintPublicKey);
    console.log(`View on Solscan: https://solscan.io/tx/${result.signature}`);

    return result;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

// Execute the function
createToken()
  .then((result) => {
    console.log("Success:", result);
  })
  .catch((error) => {
    console.error("Failed:", error);
  });
