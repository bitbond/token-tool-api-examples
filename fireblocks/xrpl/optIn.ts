import { apiPost } from "../../common/xrplApi";
import { CHAIN_ID, ISSUANCE_ID } from "./config";
import { connect, submitWithFee } from "./signer";

// ============================================================================
// Opt a HOLDER account in to the MPT (holder-side MPTokenAuthorize).
//
// An XRPL account cannot receive an MPT until it has opted in, and only the
// holder can sign that. This script covers holders whose XRP account is also a
// Fireblocks vault (e.g. investor or omnibus vaults you operate). External
// holders opt in from their own wallet.
//
// If the token was created with requireAuth, the issuer must additionally
// authorize the holder afterwards: manageToken.ts with action "authorize".
// ============================================================================

// The holder's Fireblocks vault ID and its XRP address (r...).
const HOLDER_VAULT_ID = "2";
const HOLDER_ADDRESS = "r...";

// "optIn", or "optOut" to remove a zero-balance MPToken entry and free the reserve.
const ACTION: "optIn" | "optOut" = "optIn";

void (async () => {
  const client = await connect();
  try {
    const built = await apiPost("/opt-in-mpt-tx", {
      chainId: CHAIN_ID,
      issuanceId: ISSUANCE_ID,
      action: ACTION,
    });
    await submitWithFee(client, HOLDER_VAULT_ID, HOLDER_ADDRESS, built, ACTION);
    console.log(`\n${HOLDER_ADDRESS} ${ACTION} complete.`);
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
  }
})();
