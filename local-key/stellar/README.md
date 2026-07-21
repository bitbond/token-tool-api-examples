# Bitbond Token Tool - Stellar

This directory demonstrates how to programmatically deploy and manage Stellar
tokens through the Bitbond Token Tool **public Stellar API** (`/api/v1`), using a
private key stored locally.

Two token standards are covered:

- **Classic** — a SEP-based issued asset settled on Horizon (`classic/`).
- **Soroban** — a SEP-41 smart-contract token (`soroban/`).

The API is **non-custodial**: `*/build` endpoints return an *unsigned*
transaction (base64 XDR) plus its final hash. You sign locally with your own key
and post the signed XDR back to `/submit`. **No key material ever reaches the
server.** Every state-changing operation follows the same four steps:

1. **Build** — `POST` a `*/build` endpoint → `{ xdr, hash, txKind, feeStroops }`
2. **Sign** — sign the XDR locally with the source account's secret key
3. **Submit** — `POST /submit` with the signed XDR → `202 { status: "pending" }`
4. **Poll** — `GET /status/{hash}` until it resolves to `success` | `failed`

> **Submit/poll contract:** only a `failed` outcome permits re-signing.
> `pending` means "check the explorer, do not re-sign" — the transaction may
> still land. All of this is handled for you by the `buildSignSubmit` /
> `pollStatus` helpers in [`common/stellarApi.ts`](../../common/stellarApi.ts).

> These scripts are a simple illustration of interaction with the API. For
> production use we strongly advise employing a secure key custody solution.

## Requirements

Recommended:
- Node.js 22.11.0 or higher
- yarn 1.22.0 or higher

## Setup

1. Install [Node.js](https://nodejs.org/en) and [yarn](https://yarnpkg.com).

2. Install node packages:
   ```bash
   yarn install
   ```

3. Create the account keys. A Classic asset needs **two** funded accounts (an
   issuer and a separate distribution account); Soroban needs one admin account.
   To generate a random keypair:
   ```bash
   yarn tsx ./local-key/stellar/createWallet.ts
   ```
   Save the secret keys (`S...`) into files in this directory. The scripts read:
   - `local-key/stellar/issuer_secret_key` — issuer (Classic) / admin (Soroban)
   - `local-key/stellar/distribution_secret_key` — distribution (Classic)

   See [`secret_key.example`](./secret_key.example) for the format. The `*_key`
   suffix is gitignored — **never commit real keys**.

4. Fund the accounts. On **testnet**, use friendbot:
   ```bash
   curl "https://friendbot.stellar.org/?addr=<PUBLIC_KEY>"
   ```
   On **mainnet**, send XLM from an already-funded account.

5. Fill in [`config.ts`](./config.ts) **once**. The shared account/asset
   identifiers (`CHAIN_ID`, `CODE`, `ISSUER_ADDRESS`, `DISTRIBUTION_ADDRESS`,
   `SUPPLY`, `ADMIN_ADDRESS`, `TOKEN_ADDRESS`) live here and every script reads
   them, so you don't repeat them per file. Operation-specific knobs (compliance
   flags, recipient lists, the chosen manage action, mint amounts) stay in the
   individual scripts. Set `TOKEN_ADDRESS` after you deploy a SEP-41 token — the
   deploy script prints it.

### Host configuration

The scripts default to `https://tokentool.bitbond.com` (the Stellar app is served
under the `/stellar` base path, so the API base is
`https://tokentool.bitbond.com/stellar/api/v1`). To target a different
deployment (e.g. a PR preview), set `TOKEN_TOOL_HOST`:

```bash
TOKEN_TOOL_HOST="https://pr-123.pr.tokentool.bitbond.net" yarn tsx ./local-key/stellar/classic/createAsset.ts
```

`CHAIN_ID` is set in [`config.ts`](./config.ts) — `"testnet"` or `"mainnet"`.

## Classic asset lifecycle (`classic/`)

A Classic asset is created in three ordered, separately-signed transactions:
**flags → trustline → issuance**. `issuer` and `distributionAddress` must be
different accounts (an issuer cannot hold its own asset).

### Create an asset
Set the shared values in `config.ts` and the compliance flags in `createAsset.ts`,
then:
```bash
yarn tsx ./local-key/stellar/classic/createAsset.ts
```
Runs the full flags → trustline → issuance sequence. Optionally locks the issuer
during issuance to fix the supply permanently.

### Mint more supply
```bash
yarn tsx ./local-key/stellar/classic/mintAsset.ts
```
Mints additional supply to the distribution account (only while the issuer is
unlocked).

### Trustlines (recipients must trust the asset first)
A Classic payment fails unless the recipient already **trusts** the asset, and a
trustline needs the holder's own signature and XLM reserve — you cannot add one
for an account whose key you don't hold. So the holder adds it themselves on the
Token Tool manage page, with their wallet connected:
```
<host>/stellar/manage-token/<CODE>-<ISSUER>?networkName=<chainId>
```
This is the same "trustline invite" link the Token Tool app shares from its
airdrop flow. `distributeAsset.ts` probes recipients and prints it for the ones
that need it (see below).

### Distribute to holders
```bash
yarn tsx ./local-key/stellar/classic/distributeAsset.ts
```
Sends the asset from the distribution account to a list of `G...` recipients.
Before sending, it **probes each recipient's trustline** (via
`/classic/account/held-assets`) and skips any that don't trust the asset yet,
listing them with the invite link to share — the same exclusion the Token Tool
app's airdrop flow applies. It then distributes to the eligible recipients,
chunked into ≤ 99 per transaction.

### Manage (authorize / freeze / clawback / lock)
```bash
yarn tsx ./local-key/stellar/classic/manageAsset.ts
```
Pick an `ACTION` in the file: holder `authorize`/`freeze`/`unfreeze`, `clawback`,
or `lock-issuer` (fix the supply).

### Read on-chain state
```bash
yarn tsx ./local-key/stellar/classic/readAsset.ts
```
Prints asset info (flags, supply, holder count, lock status) and the holder list.

## Soroban (SEP-41) token lifecycle (`soroban/`)

A SEP-41 token is a single smart-contract deployment. Amounts are **raw
base-unit integer strings** in the token's own decimals (e.g. 1000 tokens of a
7-decimal token is `"10000000000"`).

### Deploy a token
Set `ADMIN_ADDRESS` in `config.ts` and the token config in `deployToken.ts`
(name, symbol, supply, capabilities), then:
```bash
yarn tsx ./local-key/stellar/soroban/deployToken.ts
```
The admin (`G...`) account becomes the token owner. The script prints the
deployed contract address (`C...`) — copy it into `TOKEN_ADDRESS` in `config.ts`
for the manage/distribute scripts. (It reads the address from the deploy
transaction via Soroban RPC; override the RPC with the `SOROBAN_RPC_URL` env var.)

### Manage (mint / burn / pause / blacklist / …)
```bash
yarn tsx ./local-key/stellar/soroban/manageToken.ts
```
Pick an `ACTION` in the file. `TOKEN_ADDRESS` and the admin signer come from
`config.ts`.

### Distribute to holders
```bash
yarn tsx ./local-key/stellar/soroban/distributeToken.ts
```
Sends the token to a list of recipients (`G...` or `C...`). SEP-41 distribution
runs through a distribution contract that moves your tokens via `transfer_from`,
so the script first sends a one-time **approval** (`/soroban/distribute/approve/build`)
letting that contract spend your tokens, then distributes — automatically chunked
into ≤ 20 recipients per transaction.

## API limits

| Limit                                    | Value |
| ---------------------------------------- | ----- |
| Classic distribute recipients / tx       | 99    |
| SEP-41 distribute recipients / tx        | 20    |
| Classic authorization holders / tx       | 100   |
| Holder enumeration ceiling               | 5,000 |

See the Token Tool documentation for the full public API reference.
