# Bitbond Token Tool x Fireblocks - Stellar

These scripts deploy and manage Stellar tokens through the Bitbond Token Tool
**public Stellar API** (`/stellar/api/v1`). Every transaction is signed by a
**Fireblocks vault**. They cover the same operations as the
[local-key Stellar examples](../../local-key/stellar/README.md): Classic assets
and SEP-41 (Soroban) tokens. Read that README for what each operation does on
chain. This one covers only what changes with Fireblocks.

## How signing works

Fireblocks has no native operation for Soroban contract calls or Token Tool's
Classic builds, so the scripts use Fireblocks **RAW signing**:

1. **Build**: Token Tool returns the unsigned transaction (XDR) and its final hash.
2. **Sign**: the hash is sent to Fireblocks as a RAW message
   (`operation: RAW`, `assetId: XLM` / `XLM_TEST`, source = the vault).
   Fireblocks applies your TAP policy and approvals, then signs it with the
   vault's Ed25519 key. Stellar signs the transaction hash, so this is exactly
   the signature a local `Keypair.sign` would produce.
3. **Attach**: the script adds the signature to the envelope. `addSignature`
   checks it against the vault's public key. The script also refuses to run if
   the vault's address does not match the address in `config.ts`.
4. **Submit and poll**: same as the local-key flow (`POST /submit`, then
   `GET /status/{hash}`).

The transaction hash is also the Fireblocks `externalTxId`, so a restarted
script cannot get the same transaction signed twice. The logic lives in
[`signer.ts`](./signer.ts) (about 30 lines). It plugs into the shared
`buildSubmitWith` lifecycle in [`common/stellarApi.ts`](../../common/stellarApi.ts).

## Fireblocks workspace prerequisites

1. **RAW signing enabled.** It is off by default in production workspaces. Ask
   your Fireblocks Customer Success Manager to turn it on. Sandbox workspaces
   have it on.
2. **A TAP rule allowing RAW** from the API user, for the vaults below, with the
   `XLM` / `XLM_TEST` asset. Without one, requests end `BLOCKED`.
3. **Approve within 3 minutes.** Token Tool builds carry 180-second time bounds,
   and a Soroban build's simulated footprint goes stale quickly. A transaction
   still awaiting approval after that cannot land on chain. The script stops
   waiting after 170 s. Cancel that Fireblocks request and run the script again
   to rebuild. For multi-approver policies, consider a rule that auto-approves
   RAW requests from this API user for these vaults. Approval of the business
   action can then happen upstream.
4. **Vault accounts with XLM.** Add the `XLM` (or `XLM_TEST`) asset to each
   vault and fund it. The deposit address (`G...`) is the Stellar account the
   scripts use:
   - **Classic**: an issuer vault and a separate distribution vault (an issuer
     cannot hold its own asset).
   - **SEP-41**: one admin vault (the issuer vault by default).

## Setup

1. `yarn install`
2. Create an API user with the **Signer** role. Pair it with the workspace's
   **API Co-Signer**, otherwise its requests are never signed. Generate its key
   pair outside the repository:
   ```bash
   openssl req -new -newkey rsa:4096 -nodes -keyout fireblocks_secret.key -out fireblocks.csr -subj '/O=<your organisation>'
   ```
   Upload `fireblocks.csr` in the Console. Then copy [`.env.example`](../../.env.example)
   to `.env` in the repo root (it is gitignored) and set `FIREBLOCKS_API_KEY` and
   `FIREBLOCKS_API_PRIVATE_KEY_PATH`. Set `FIREBLOCKS_API_BASE_URL` only for a
   sandbox or EU workspace. Environment variables already set take precedence
   over `.env`.
3. Fill in [`config.ts`](./config.ts) once: `CHAIN_ID`, the vault IDs and their
   `G...` addresses, the asset `CODE` and `SUPPLY`. After a SEP-41 deploy, also
   set `TOKEN_ADDRESS` to the printed `C...` address. `ASSET_ID` follows
   `CHAIN_ID`.

## Scripts

| Script | Signs with | What it does |
| --- | --- | --- |
| `classic/createAsset.ts` | issuer, then distribution | flags, trustline, issuance |
| `classic/mintAsset.ts` | issuer | mint more supply to the distribution account |
| `classic/distributeAsset.ts` | distribution | send to many `G...` holders; skips holders without a trustline |
| `classic/manageAsset.ts` | issuer | authorize / freeze / unfreeze / clawback / lock-issuer |
| `soroban/deployToken.ts` | admin | deploy a SEP-41 token; prints its `C...` address |
| `soroban/manageToken.ts` | admin | mint / burn / pause / blacklist / change-owner / balance-limit |
| `soroban/distributeToken.ts` | admin | one approval, then distribute in chunks of up to 20 |

```bash
yarn tsx ./fireblocks/stellar/classic/createAsset.ts
yarn tsx ./fireblocks/stellar/soroban/deployToken.ts
```

For read-only queries (asset info, holders), use
[`local-key/stellar/classic/readAsset.ts`](../../local-key/stellar/classic/readAsset.ts).
It needs no key.

Each Fireblocks request costs one approval. A Classic create is up to 3
requests. A distribution is one request per chunk (plus the approval for SEP-41).

> **Locking the issuer is irreversible.** It removes the issuer account's
> signers, so the Fireblocks vault can never sign for that account again.
