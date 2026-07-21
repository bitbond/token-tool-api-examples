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

### Host configuration

The scripts default to `https://tokentool.bitbond.com` (the Stellar app is served
under the `/stellar` base path, so the API base is
`https://tokentool.bitbond.com/stellar/api/v1`). To target a different
deployment (e.g. a PR preview), set `TOKEN_TOOL_HOST`:

```bash
TOKEN_TOOL_HOST="https://pr-123.pr.tokentool.bitbond.net" yarn tsx ./local-key/stellar/classic/createAsset.ts
```

Every script has a `CHAIN_ID` constant at the top — `"testnet"` or `"mainnet"`.

## Classic asset lifecycle (`classic/`)

A Classic asset is created in three ordered, separately-signed transactions:
**flags → trustline → issuance**. `issuer` and `distributionAddress` must be
different accounts (an issuer cannot hold its own asset).

### Create an asset
Customize `createAsset.ts` (code, addresses, supply, compliance flags), then:
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

### Distribute to holders
```bash
yarn tsx ./local-key/stellar/classic/distributeAsset.ts
```
Sends the asset from the distribution account to a list of `G...` recipients (who
must already trust the asset). Automatically chunks into ≤ 99 recipients per
transaction.

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
Customize `deployToken.ts` (name, symbol, supply, capabilities), then:
```bash
yarn tsx ./local-key/stellar/soroban/deployToken.ts
```
The admin (`G...`) account becomes the token owner. After it lands, read the
deployed contract address (`C...`) from the transaction on the explorer — you
pass it as `tokenAddress` to the manage/distribute scripts.

### Manage (mint / burn / pause / blacklist / …)
```bash
yarn tsx ./local-key/stellar/soroban/manageToken.ts
```
Pick an `ACTION` in the file. Set `TOKEN_ADDRESS` (`C...`) and `SIGNER_ADDRESS`
(the `G...` admin).

### Distribute to holders
```bash
yarn tsx ./local-key/stellar/soroban/distributeToken.ts
```
Sends the token to a list of recipients (`G...` or `C...`). Automatically chunks
into ≤ 20 recipients per transaction.

## API limits

| Limit                                    | Value |
| ---------------------------------------- | ----- |
| Classic distribute recipients / tx       | 99    |
| SEP-41 distribute recipients / tx        | 20    |
| Classic authorization holders / tx       | 100   |
| Holder enumeration ceiling               | 5,000 |

See the Token Tool documentation for the full public API reference.
