import { isValidClassicAddress } from "xrpl";
import { apiPost, optInStatus, ServiceFee } from "../../common/xrplApi";
import { CHAIN_ID, DECIMALS, ISSUANCE_ID, ISSUER_ADDRESS, ISSUER_VAULT_ID } from "./config";
import { connect, signAndSubmit, submitWithFee } from "./signer";

// ============================================================================
// Distribute (airdrop) an MPT from the issuer vault to many holders.
//
// XRPL has no batch payment here: the build returns one Payment per recipient,
// each signed by the issuer vault and submitted in turn, so a run of N
// recipients is N Fireblocks signing requests (plus one fee Payment on mainnet,
// priced per recipient). Up to 500 recipients per build.
//
// Every recipient must have opted in to the token first (optIn.ts, or from
// their own wallet). This script probes each recipient and skips the ones that
// have not, instead of failing mid-run.
// ============================================================================

// address: r...; amount: human-decimal string.
const RECIPIENTS: Array<{ address: string; amount: string }> = [
  { address: "r...", amount: "100" },
  { address: "r...", amount: "250.5" },
];

// The opt-in probe accepts up to 200 holders per call.
const PROBE_CHUNK = 200;

void (async () => {
  const client = await connect();
  try {
    const invalid = RECIPIENTS.filter((r) => !isValidClassicAddress(r.address));
    if (invalid.length > 0) {
      throw new Error(`Invalid recipient address(es): ${invalid.map((r) => r.address).join(", ")}`);
    }

    const optedIn = new Set<string>();
    for (let i = 0; i < RECIPIENTS.length; i += PROBE_CHUNK) {
      const holders = RECIPIENTS.slice(i, i + PROBE_CHUNK).map((r) => r.address);
      for (const s of await optInStatus(CHAIN_ID, ISSUANCE_ID, holders)) {
        if (s.optedIn) optedIn.add(s.holder);
        if (s.locked) console.warn(`  ${s.holder} is locked - its payment will fail`);
      }
    }
    const recipients = RECIPIENTS.filter((r) => optedIn.has(r.address));
    const skipped = RECIPIENTS.filter((r) => !optedIn.has(r.address));
    if (skipped.length > 0) {
      console.log(`${skipped.length} recipient(s) have not opted in - skipping:`);
      for (const r of skipped) console.log(`  ${r.address}`);
    }
    if (recipients.length === 0) {
      console.log("No recipient can receive the token yet - nothing to distribute.");
      return;
    }

    const built = await apiPost<{
      transactions: Array<{ txjson: Record<string, unknown>; index: number }>;
      fee: ServiceFee;
    }>("/airdrop-mpt-tx", {
      chainId: CHAIN_ID,
      address: ISSUER_ADDRESS,
      mode: "mpt",
      issuanceId: ISSUANCE_ID,
      decimals: DECIMALS,
      recipients,
    });

    // Pay the (per-recipient) service fee once, together with the first payment.
    const [first, ...rest] = built.transactions;
    await submitWithFee(
      client,
      ISSUER_VAULT_ID,
      ISSUER_ADDRESS,
      { txjson: first.txjson, fee: built.fee },
      `distribute 1/${built.transactions.length}`
    );
    for (const { txjson, index } of rest) {
      await signAndSubmit(
        client,
        ISSUER_VAULT_ID,
        ISSUER_ADDRESS,
        txjson,
        `distribute ${index + 1}/${built.transactions.length}`
      );
    }
    console.log(`\nDistributed to ${recipients.length} recipient(s).`);
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
  }
})();
