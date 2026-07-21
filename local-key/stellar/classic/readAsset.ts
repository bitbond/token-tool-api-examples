import { apiGet, ChainId } from "../../../common/stellarApi";

// ============================================================================
// Read-only queries for a Classic asset. No signing, no fees.
//
//   /classic/asset   - flags, total supply, holder count, lock status (no fan-out)
//   /classic/holders - the holder list (a Horizon fan-out read; rate-limit it)
// ============================================================================

const CHAIN_ID: ChainId = "testnet";
const CODE = "ABC";
const ISSUER_ADDRESS = "G...";

interface AssetInfo {
  exists: boolean;
  totalSupply: string;
  numHolders: number;
  masterWeight: number;
  isLocked: boolean;
  flags: Record<string, boolean>;
}

interface HoldersInfo {
  count: number;
  holdersTruncated: boolean;
  holders: Array<{ account: string; balance: string }>;
}

void (async () => {
  try {
    const query = { chainId: CHAIN_ID, code: CODE, issuer: ISSUER_ADDRESS };

    const asset = await apiGet<AssetInfo>("/classic/asset", query);
    console.log("Asset info:", JSON.stringify(asset, null, 2));

    if (!asset.exists) {
      console.log("Asset does not exist yet.");
      return;
    }

    // Fan-out read - `holdersTruncated: true` marks the 5,000-holder ceiling.
    const holders = await apiGet<HoldersInfo>("/classic/holders", query);
    console.log(`\n${holders.count} holder(s) (truncated: ${holders.holdersTruncated}):`);
    for (const h of holders.holders.slice(0, 20)) {
      console.log(`  ${h.account}: ${h.balance}`);
    }
    if (holders.holders.length > 20) {
      console.log(`  ... and ${holders.holders.length - 20} more`);
    }
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
