import {
  buildSignSubmit,
  explorerTxUrl,
  hasClassicTrustline,
  isValidAccount,
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
    // Catch malformed destinations up front (e.g. a stray character) and name
    // them, instead of an opaque 400 from the first probe/build.
    const invalid = RECIPIENTS.filter((r) => !isValidAccount(r.destination));
    if (invalid.length > 0) {
      console.error("Invalid recipient address(es) - fix these and re-run:");
      for (const r of invalid) console.error(`  ${r.destination}`);
      process.exitCode = 1;
      return;
    }

    let recipients = RECIPIENTS;

    // Pre-flight: an issued asset can only be received by an account that trusts
    // it, so the build fails for any recipient without a trustline. Probe each
    // recipient (native XLM needs no trustline) and split out the ones that
    // can't receive yet - report them with the invite link and skip them, rather
    // than letting a chunk fail mid-run. (This mirrors the Token Tool app's
    // airdrop flow, which excludes no-trustline holders the same way.)
    if (ASSET !== "native") {
      const { code, issuer } = ASSET;
      const probes = await Promise.all(
        RECIPIENTS.map(async (r) => ({
          recipient: r,
          trusts: await hasClassicTrustline(CHAIN_ID, r.destination, code, issuer),
        }))
      );
      recipients = probes.filter((p) => p.trusts).map((p) => p.recipient);
      const missing = probes.filter((p) => !p.trusts).map((p) => p.recipient);

      if (missing.length > 0) {
        console.log(`\n${missing.length} recipient(s) do not trust ${code} yet - skipping:`);
        for (const m of missing) console.log(`  ${m.destination}`);
        console.log(
          `Send them this link to add the trustline (wallet connected, ${CHAIN_ID} selected):\n  ` +
            manageAssetUrl(CHAIN_ID, code, issuer)
        );
      }
    }

    if (recipients.length === 0) {
      console.log("\nNo recipients can receive the asset yet - nothing to distribute.");
      return;
    }

    const chunks: Array<typeof recipients> = [];
    for (let i = 0; i < recipients.length; i += MAX_PER_TX) {
      chunks.push(recipients.slice(i, i + MAX_PER_TX));
    }

    console.log(
      `\nDistributing to ${recipients.length} recipient(s) in ${chunks.length} transaction(s).`
    );

    for (let i = 0; i < chunks.length; i++) {
      // Rebuild each chunk right before signing so the sequence number is fresh.
      const result = await buildSignSubmit(
        CHAIN_ID,
        "/classic/distribute",
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
