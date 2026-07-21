import {
  buildSignSubmit,
  explorerTxUrl,
  loadSecretKey,
  manageAssetUrl,
} from "../../../common/stellarApi";
import {
  CHAIN_ID,
  CODE,
  DISTRIBUTION_ADDRESS,
  ISSUER_ADDRESS,
} from "../config";

// ============================================================================
// Distribute a Classic asset from the distribution account to many holders.
//
// Signed by the distribution account (`source`). Fee-bearing (per recipient).
// At most 99 recipients per transaction - larger runs must be split into chunks
// that are each built -> signed -> submitted -> polled in turn (rebuild each
// chunk so the sequence number stays fresh). This script shows the chunking loop.
//
// Classic payment recipients are G... accounts only (contract C... addresses are
// rejected on the Classic rail). Each recipient must already trust the asset -
// a build fails for any recipient that does not. A holder cannot be given a
// trustline by someone else; they add it themselves via the Token Tool manage
// page (printed below) with their wallet connected.
// ============================================================================

// The distribution account (G...) holds and sends the asset.
const SOURCE_ADDRESS = DISTRIBUTION_ADDRESS;

// The asset to distribute: either "native" (XLM) or an issued asset ref. The
// identity helper keeps ASSET typed as the full union so the "native" branch
// below stays reachable (a plain const narrows to the assigned variant).
type DistributeAsset = "native" | { code: string; issuer: string };
const asset = (a: DistributeAsset): DistributeAsset => a;
const ASSET = asset({ code: CODE, issuer: ISSUER_ADDRESS });

// Recipients: destination (G...) + human-decimal amount (max 7 decimals).
const RECIPIENTS: Array<{ destination: string; amount: string }> = [
  { destination: "G...", amount: "100" },
  { destination: "G...", amount: "250.5" },
];

// Classic distribute allows up to 99 recipients per transaction.
const MAX_PER_TX = 99;

const SOURCE_SECRET = loadSecretKey("./local-key/stellar/distribution_secret_key");

void (async () => {
  try {
    const chunks: Array<typeof RECIPIENTS> = [];
    for (let i = 0; i < RECIPIENTS.length; i += MAX_PER_TX) {
      chunks.push(RECIPIENTS.slice(i, i + MAX_PER_TX));
    }

    console.log(
      `Distributing to ${RECIPIENTS.length} recipient(s) in ${chunks.length} transaction(s).`
    );

    // Recipients must trust the asset first (native XLM needs no trustline).
    // Share this link with any recipient that cannot receive yet - they connect
    // their wallet (with ${CHAIN_ID} selected) and add the trustline themselves.
    if (ASSET !== "native") {
      console.log(
        `Recipients must trust ${ASSET.code} first. To add the trustline they open:\n  ` +
          manageAssetUrl(ASSET.code, ASSET.issuer)
      );
    }

    for (let i = 0; i < chunks.length; i++) {
      // Rebuild each chunk right before signing so the sequence number is fresh.
      const result = await buildSignSubmit(
        CHAIN_ID,
        "/classic/distribute/build",
        { source: SOURCE_ADDRESS, asset: ASSET, recipients: chunks[i] },
        SOURCE_SECRET,
        `distribute chunk ${i + 1}/${chunks.length}`
      );
      console.log(explorerTxUrl(CHAIN_ID, result.hash));
    }

    console.log("\nDistribution complete.");
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
