"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
    chainId: "solana-devnet",
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
// HELPER FUNCTIONS
// ============================================================================
// Helper function: Signs and sends a transaction with private key
function sendTransaction(transaction, connection, keypair, options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Sign transaction with keypair (partial sign to keep existing signatures)
        if (transaction instanceof web3_js_1.Transaction) {
            transaction.partialSign(keypair);
        }
        else {
            transaction.sign([keypair]);
        }
        // Send signed transaction with requireAllSignatures: false to allow partially signed tx
        const rawTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });
        const signature = yield connection.sendRawTransaction(rawTransaction, {
            skipPreflight: (_a = options === null || options === void 0 ? void 0 : options.skipPreflight) !== null && _a !== void 0 ? _a : false,
            maxRetries: (_b = options === null || options === void 0 ? void 0 : options.maxRetries) !== null && _b !== void 0 ? _b : 3,
        });
        return signature;
    });
}
// Helper function: Loads an image file from the filesystem
function loadImageFile(imagePath) {
    if (!fs_1.default.existsSync(imagePath)) {
        console.warn(`Image file not found: ${imagePath}`);
        return undefined;
    }
    const imageBuffer = fs_1.default.readFileSync(imagePath);
    const imageBlob = new Blob([new Uint8Array(imageBuffer)], {
        type: "image/png",
    });
    const imageFile = new File([imageBlob], path_1.default.basename(imagePath), {
        type: "image/png",
    });
    return imageFile;
}
// Helper function: Uploads an image file to Pinata IPFS
function uploadImageToPinata(imageFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const pinataFormData = new FormData();
        pinataFormData.append("file", imageFile);
        const pinataResponse = yield fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: pinataFormData,
        });
        if (!pinataResponse.ok) {
            throw new Error(`Pinata upload failed: ${pinataResponse.statusText}`);
        }
        const pinataData = yield pinataResponse.json();
        return `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;
    });
}
// Helper function: Builds transaction via API and executes it on-chain
function buildAndExecuteTokenTransaction(formData, connection, keypair) {
    return __awaiter(this, void 0, void 0, function* () {
        const publicKey = keypair.publicKey;
        // Prepare owner address
        const ownerAddress = formData.owner && formData.owner.trim() !== ""
            ? formData.owner
            : publicKey.toString();
        // Call Next.js API to build transaction
        const apiResponse = yield fetch("https://tokentool.bitbond.com/sol/api/build-token-tx", {
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
        });
        if (!apiResponse.ok) {
            throw new Error(`Failed to build token transaction: ${apiResponse.statusText}`);
        }
        const apiData = yield apiResponse.json();
        const { serializedTx, blockhash, lastValidBlockHeight, mintPublicKey } = apiData.data;
        // Deserialize transaction from base64
        const txBuffer = Buffer.from(serializedTx, "base64");
        const transaction = web3_js_1.Transaction.from(txBuffer);
        // Send transaction to the blockchain using custom sendTransaction
        const signature = yield sendTransaction(transaction, connection, keypair, {
            skipPreflight: false,
            maxRetries: 5,
        });
        // Confirm transaction
        const confirmationStrategy = {
            signature,
            blockhash,
            lastValidBlockHeight,
        };
        const confirmation = yield connection.confirmTransaction(confirmationStrategy, "confirmed");
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        return {
            signature,
            mintPublicKey,
        };
    });
}
// ============================================================================
// MAIN FUNCTION
// ============================================================================
// Main function: Creates a Solana SPL token with all configurations
function createToken() {
    return __awaiter(this, void 0, void 0, function* () {
        // Load wallet from private key
        const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(PRIVATE_WALLET_KEY));
        // Determine image URL based on configuration
        let imageUrl = "";
        if (IMAGE_FILE_NAME && IMAGE_FILE_NAME !== "") {
            const imagePath = path_1.default.join(__dirname, IMAGE_FILE_NAME);
            const imageFile = loadImageFile(imagePath);
            if (imageFile) {
                imageUrl = yield uploadImageToPinata(imageFile);
            }
            else {
                throw new Error(`Failed to load image file: ${IMAGE_FILE_NAME}`);
            }
        }
        else if (IMAGE_URL && IMAGE_URL !== "") {
            imageUrl = IMAGE_URL;
        }
        else {
            // No valid image configuration
            throw new Error("Either IMAGE_FILE_NAME or IMAGE_URL must be properly configured");
        }
        // Prepare form data using config
        const formData = {
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
        const rpcUrl = formData.chainId === "solana"
            ? "https://api.mainnet-beta.solana.com"
            : "https://api.devnet.solana.com";
        const connection = new web3_js_1.Connection(rpcUrl, "confirmed");
        try {
            const result = yield buildAndExecuteTokenTransaction(formData, connection, keypair);
            console.log("Token created successfully!");
            console.log("Transaction signature:", result.signature);
            console.log("Mint address:", result.mintPublicKey);
            console.log(`View on Solscan: https://solscan.io/tx/${result.signature}`);
            return result;
        }
        catch (error) {
            console.error("Error creating token:", error);
            throw error;
        }
    });
}
// Execute the function
createToken()
    .then((result) => {
    console.log("Success:", result);
})
    .catch((error) => {
    console.error("Failed:", error);
});
