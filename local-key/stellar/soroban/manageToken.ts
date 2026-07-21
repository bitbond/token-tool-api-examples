import fs from "fs";
import {
  buildSignSubmit,
  ChainId,
  explorerTxUrl,
  loadSecretKey,
} from "../../../common/stellarApi";

// ============================================================================
// Manage a deployed SEP-41 (Soroban) token. Pick an ACTION below.
//
// Every manage call shares { signer, tokenAddress }: `signer` is the G... admin
// account that signs, `tokenAddress` is the deployed C... token contract. Builds
// simulate + prepare server-side and are zero-fee. A prepared XDR goes stale
// quickly - the script signs and submits promptly.
//
// SEP-41 amounts are raw base-unit integer strings in the token's own decimals.
// ============================================================================

const CHAIN_ID: ChainId = "testnet";

// The deployed token contract address (C...).
const TOKEN_ADDRESS = "C...";

// The admin (G...) that signs management operations.
const SIGNER_ADDRESS = "G...";

type ManageAction =
  | { kind: "mint"; receiver: string; amount: string }
  | { kind: "burn"; amount: string }
  | { kind: "pause"; paused: boolean }
  | { kind: "blacklist"; address: string; remove: boolean }
  | { kind: "change-owner"; newOwner: string }
  | { kind: "balance-limit"; balanceLimit: string };

// Identity helper: keeps ACTION typed as the full union (so every switch branch
// stays reachable) instead of narrowing to the one variant assigned below.
const pick = (a: ManageAction): ManageAction => a;

// Choose one action. Amounts are raw base units (e.g. "10000000000").
const ACTION = pick({
  kind: "mint",
  receiver: "G...", // G... or C... - SEP-41 can settle to contracts too
  amount: "5000000000",
});

const SIGNER_SECRET = loadSecretKey(
  "./local-key/stellar/issuer_secret_key",
  fs
);

void (async () => {
  try {
    const base = { signer: SIGNER_ADDRESS, tokenAddress: TOKEN_ADDRESS };
    let path: string;
    let body: Record<string, unknown>;

    switch (ACTION.kind) {
      case "mint":
        path = "/soroban/manage/mint/build";
        body = { ...base, receiver: ACTION.receiver, amount: ACTION.amount };
        break;
      case "burn":
        path = "/soroban/manage/burn/build";
        body = { ...base, amount: ACTION.amount };
        break;
      case "pause":
        path = "/soroban/manage/pause/build";
        body = { ...base, paused: ACTION.paused };
        break;
      case "blacklist":
        path = "/soroban/manage/blacklist/build";
        body = { ...base, address: ACTION.address, remove: ACTION.remove };
        break;
      case "change-owner":
        path = "/soroban/manage/change-owner/build";
        body = { ...base, newOwner: ACTION.newOwner };
        break;
      case "balance-limit":
        path = "/soroban/manage/balance-limit/build";
        body = { ...base, balanceLimit: ACTION.balanceLimit };
        break;
    }

    const result = await buildSignSubmit(CHAIN_ID, path, body, SIGNER_SECRET, ACTION.kind);
    console.log(`\n${ACTION.kind} complete.`);
    console.log(explorerTxUrl(CHAIN_ID, result.hash));
  } catch (e: unknown) {
    console.error("Failed:", e);
    process.exitCode = 1;
  }
})();
