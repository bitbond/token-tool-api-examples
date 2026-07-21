import {
  buildSignSubmit,
  ChainId,
  explorerTxUrl,
  loadSecretKey,
} from "../../../common/stellarApi";

// ============================================================================
// Compliance / lifecycle management for a Classic asset. Pick an ACTION below.
// All actions are issuer-signed and zero-fee.
//
//   authorize | freeze | unfreeze  - control a holder's trustline authorization
//                                     (requires the auth_required / auth_revocable
//                                     flags to have been set at creation).
//   clawback                        - claw back an amount from a holder (requires
//                                     the clawback flag).
//   lock-issuer                     - remove the issuer's signers to permanently
//                                     fix the supply. Refused on a flagged issuer.
// ============================================================================

const CHAIN_ID: ChainId = "testnet";

const CODE = "ABC";
const ISSUER_ADDRESS = "G...";

type ManageAction =
  | { kind: "authorization"; action: "authorize" | "freeze" | "unfreeze"; holders: string[] }
  | { kind: "clawback"; holder: string; amount: string }
  | { kind: "lock-issuer" };

// Identity helper: keeps ACTION typed as the full union (so every switch branch
// stays reachable) instead of narrowing to the one variant assigned below.
const pick = (a: ManageAction): ManageAction => a;

// Choose one action (see the ManageAction variants above).
const ACTION = pick({
  kind: "authorization",
  action: "authorize",
  holders: ["G..."], // up to 100 holders per transaction
});

const ISSUER_SECRET = loadSecretKey("./local-key/stellar/issuer_secret_key");

void (async () => {
  try {
    let path: string;
    let body: Record<string, unknown>;
    let label: string;

    switch (ACTION.kind) {
      case "authorization":
        path = "/classic/manage/authorization/build";
        body = { code: CODE, issuer: ISSUER_ADDRESS, holders: ACTION.holders, action: ACTION.action };
        label = `authorization:${ACTION.action}`;
        break;
      case "clawback":
        path = "/classic/manage/clawback/build";
        body = { code: CODE, issuer: ISSUER_ADDRESS, holder: ACTION.holder, amount: ACTION.amount };
        label = "clawback";
        break;
      case "lock-issuer":
        path = "/classic/manage/lock-issuer/build";
        body = { issuer: ISSUER_ADDRESS };
        label = "lock-issuer";
        break;
    }

    const result = await buildSignSubmit(CHAIN_ID, path, body, ISSUER_SECRET, label);
    console.log(`\n${label} complete.`);
    console.log(explorerTxUrl(CHAIN_ID, result.hash));
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
