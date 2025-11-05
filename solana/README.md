# Bitbond Token Tool - Solana

This directory contains a script to programmatically create Solana SPL tokens using Bitbond Token Tool.

## Requirements

Recommended:
- Node.js 18.16.0 or higher
- npm 9.5.1 or higher

## Setup

1. Install [Node.js](https://nodejs.org/en) and [npm](https://npmjs.com).
   Exact installation steps depend on the platform, please refer to the documentation for instructions.

2. Install node packages:
```bash
npm install
```

3. Install required dependencies:
```bash
npm install @solana/web3.js bs58
npm install --save-dev @types/bs58
```

## Deploying a new token

1. Customize configuration in `deployToken.ts`:
   - Set `PINATA_JWT` with your Pinata JWT token
   - Set `PRIVATE_WALLET_KEY` with your wallet's private key (base58)
   - Configure either `IMAGE_FILE_NAME` or `IMAGE_URL` for token image
   - Customize token parameters in `SAMPLE_TOKEN`

2. Run the deployment script:
```bash
npx ts-node solana/deployToken.ts
```

The script will create a new SPL token on Solana and output the transaction signature and mint address.
