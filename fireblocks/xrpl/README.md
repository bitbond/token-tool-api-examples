# Bitbond Token Tool x Fireblocks - XRPL

These scripts create and manage **XRPL Multi-Purpose Tokens (MPT, XLS-33)**
through the Bitbond Token Tool XRPL API (`/xrpl/api`). Every transaction is
signed by a **Fireblocks vault**.

## How it works

The Token Tool API builds each transaction but does not fill or submit it.
Each build returns `{ txjson, fee }`:

- `txjson` is the unsigned transaction without `Account`, `Sequence`, `Fee` or
  `LastLedgerSequence`.
- `fee.feeTransactionJson` is the Token Tool service fee as an XRP `Payment`,
  or `null` when there is no fee. It is always `null` on testnet. On mainnet,
  only create and distribute carry a fee.

For each transaction, [`signer.ts`](./signer.ts) does the following:

1. Pays the service fee first, when there is one. This is a separate Payment
   from the same vault, signed the same way.
2. Sets `Account` to the vault's address and `SigningPubKey` to the vault's
   public key. It autofills `Sequence` and `Fee`.
3. Computes the XRPL signing digest: SHA-512Half of `0x53545800` followed by
   the canonical transaction. It sends that digest to Fireblocks as a **RAW**
   message (`assetId: XRP` / `XRP_TEST`). Fireblocks applies your TAP policy
   and approvals, then signs with the vault's secp256k1 key.
4. Converts Fireblocks' `r||s` signature into the low-S DER `TxnSignature` that
   XRPL requires, and verifies it locally against the vault key.
5. Submits the transaction and waits for a validated ledger. It throws unless
   the result is `tesSUCCESS`.

The digest is also the Fireblocks `externalTxId`, so a restarted script cannot
get the same transaction signed twice.

## Fireblocks workspace prerequisites

1. **RAW signing enabled.** It is off by default in production workspaces. Ask
   your Fireblocks Customer Success Manager to turn it on.
2. **A TAP rule allowing RAW** from the API user, for the vaults below, with the
   `XRP` / `XRP_TEST` asset.
3. **An approval window of about 8 minutes.** The scripts set
   `LastLedgerSequence` 150 ledgers ahead. The xrpl.js default of 20 ledgers
   (about 1 minute) is too short for approvals. Change `LEDGER_WINDOW` in
   `signer.ts` to adjust it. If approval comes later than that, the transaction
   can no longer land. Cancel the request in Fireblocks and run the script again.
4. **Vault accounts with XRP.** Add `XRP` (or `XRP_TEST`) to each vault. Fund
   it to cover the account reserve, the owner reserve for each object (an
   issuance, or a holder's MPToken entry) and fees. The deposit address
   (`r...`) is the XRPL account used. Fireblocks XRP vault keys are secp256k1.

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
3. Fill in [`config.ts`](./config.ts): `CHAIN_ID`, the issuer vault ID and its
   `r...` address, and `DECIMALS`. After creating the token, also set
   `ISSUANCE_ID`.

## Token lifecycle

The usual order:

1. **Create**: set the token properties in `createToken.ts`. All on-chain flags
   are immutable after creation. Then run:
   ```bash
   yarn tsx ./fireblocks/xrpl/createToken.ts
   ```
   The script prints the issuance ID. Copy it into `config.ts`.
2. **Holder opt-in**: an account cannot receive an MPT before it opts in, and
   only the holder can sign that. For holders that are Fireblocks vaults, set
   the holder vault in `optIn.ts` and run:
   ```bash
   yarn tsx ./fireblocks/xrpl/optIn.ts
   ```
   External holders opt in from their own wallet.
3. **Authorize**: only for `requireAuth` tokens. The issuer admits each holder:
   `manageToken.ts` with `{ kind: "authorize", holder }`.
4. **Mint / distribute**: on XRPL, minting means the issuer pays tokens out.
   - `manageToken.ts` with `{ kind: "mint", recipient, amount }` pays one holder.
   - `distributeToken.ts` pays many holders. It probes opt-in status first and
     skips holders who have not opted in.
   ```bash
   yarn tsx ./fireblocks/xrpl/distributeToken.ts
   ```
   XRPL has no batch transfer here, so N recipients means N Fireblocks signing
   requests.
5. **Manage**: `manageToken.ts` also covers `lock` / `unlock` (one holder, or
   the whole token when `holder` is omitted), `clawback` / `burn`, `deauthorize`
   and `destroy`. `destroy` works only once no tokens are outstanding.

Amounts are human-decimal strings. The API converts them using `DECIMALS`.

## Testing without Fireblocks

The signing path is the same digest, then `r||s`, then DER. It was run end to
end on XRPL testnet with a local secp256k1 key in place of Fireblocks: create,
opt-in, authorize, mint, airdrop, lock, clawback and destroy all returned
`tesSUCCESS`.
