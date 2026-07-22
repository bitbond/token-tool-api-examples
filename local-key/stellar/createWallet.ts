import { Keypair } from "@stellar/stellar-sdk";

// Generate a random Stellar keypair. Save the secret (S...) to a file such as
// `local-key/stellar/issuer_secret_key` (the *_key suffix is gitignored).
//
// A new account is inert until it is funded. On testnet, fund it via friendbot:
//   curl "https://friendbot.stellar.org/?addr=<PUBLIC_KEY>"
// On mainnet, send it XLM from a funded account. You need at least two funded
// accounts for a Classic asset (issuer + distribution).
const keypair = Keypair.random();

console.log(`Public key:  ${keypair.publicKey()}`);
console.log(`Secret key:  ${keypair.secret()}`);
