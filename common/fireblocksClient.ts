import { BasePath, Fireblocks } from "@fireblocks/ts-sdk";
import fs from "fs";

// ============================================================================
// Fireblocks client for the Stellar and XRPL examples, configured from the
// environment or a git-ignored `.env` in the repository root (see .env.example):
//
//   FIREBLOCKS_API_KEY               - the API user's key, as the Console shows it
//   FIREBLOCKS_API_PRIVATE_KEY_PATH  - absolute path of the API user's private
//                                      key file, kept outside the repository
//   FIREBLOCKS_API_BASE_URL          - only for a sandbox workspace
//                                      (https://sandbox-api.fireblocks.io) or an
//                                      EU workspace (https://eu-api.fireblocks.io)
// ============================================================================

export function fireblocksClient(): Fireblocks {
  // Variables already set in the environment win over the file.
  if (fs.existsSync(".env")) process.loadEnvFile();

  const apiKey = process.env.FIREBLOCKS_API_KEY;
  const keyPath = process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH;
  if (!apiKey || !keyPath) {
    throw new Error(
      "Set FIREBLOCKS_API_KEY and FIREBLOCKS_API_PRIVATE_KEY_PATH in the environment or .env (see .env.example)"
    );
  }

  // The SDK's base paths end in /v1; accept the bare host as well.
  const baseUrl = process.env.FIREBLOCKS_API_BASE_URL?.replace(/\/+$/, "");
  return new Fireblocks({
    apiKey,
    secretKey: fs.readFileSync(keyPath, "utf-8"),
    basePath: baseUrl ? (baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`) : BasePath.US,
  });
}
