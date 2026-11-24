import { apiPost } from "../../common/xrplApi";
import { CHAIN_ID, DECIMALS, ISSUANCE_ID, ISSUER_ADDRESS, ISSUER_VAULT_ID } from "./config";
import { connect, submitWithFee } from "./signer";

// ============================================================================
// Manage an MPT as its issuer. Pick an ACTION below. Every action is one
// transaction signed by the issuer vault; all are free of Token Tool fees.
//
//   mint                     - pay new tokens from the issuer to a holder. The
//                              holder must have opted in (optIn.ts) and, for
//                              requireAuth tokens, been authorized.
//   authorize | deauthorize  - admit / remove a holder (requireAuth tokens).
//   lock | unlock            - freeze one holder, or the whole token when holder
//                              is omitted (canLock tokens).
//   clawback | burn          - take tokens back from a holder; they are removed
//                              from circulation (canClawback tokens).
//   destroy                  - delete the issuance. Only once no tokens are
//                              outstanding.
//
// Amounts are human-decimal strings; the API converts them with `decimals`.
// ============================================================================

type ManageAction =
  | { kind: "mint"; recipient: string; amount: string }
  | { kind: "authorize" | "deauthorize"; holder: string }
  | { kind: "lock" | "unlock"; holder?: string }
  | { kind: "clawback" | "burn"; holder: string; amount: string }
  | { kind: "destroy" };

// Identity helper: keeps ACTION typed as the full union (so every switch branch
// stays reachable) instead of narrowing to the one variant assigned below.
const pick = (a: ManageAction): ManageAction => a;

const ACTION = pick({ kind: "mint", recipient: "r...", amount: "1000" });

void (async () => {
  const client = await connect();
  try {
    const base = { chainId: CHAIN_ID, address: ISSUER_ADDRESS, issuanceId: ISSUANCE_ID };
    let path: string;
    let body: Record<string, unknown>;

    switch (ACTION.kind) {
      case "mint":
        path = "/mint-mpt-tx";
        body = { ...base, recipient: ACTION.recipient, amount: ACTION.amount, decimals: DECIMALS };
        break;
      case "authorize":
      case "deauthorize":
        path = "/authorize-mpt-tx";
        body = { ...base, holder: ACTION.holder, action: ACTION.kind };
        break;
      case "lock":
      case "unlock":
        path = "/lock-mpt-tx";
        body = { ...base, holder: ACTION.holder, action: ACTION.kind };
        break;
      case "clawback":
      case "burn":
        path = `/${ACTION.kind}-mpt-tx`;
        body = { ...base, holder: ACTION.holder, amount: ACTION.amount, decimals: DECIMALS };
        break;
      case "destroy":
        path = "/destroy-mpt-tx";
        body = base;
        break;
    }

    const built = await apiPost(path, body);
    await submitWithFee(client, ISSUER_VAULT_ID, ISSUER_ADDRESS, built, ACTION.kind);
    console.log(`\n${ACTION.kind} complete.`);
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
  }
})();
