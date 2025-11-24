# Bitbond Token Tool - Solana

This directory contains a script to programmatically create Solana SPL tokens using Bitbond Token Tool.

## Requirements

Recommended:
- Node.js 22.11.0 or higher
- yarn 1.22.0 or higher

## Setup

1. Install [Node.js](https://nodejs.org/en) and [yarn](https://yarnpkg.com).
   Exact installation steps depend on the platform, please refer to the documentation for instructions.

2. Install node packages:
```bash
yarn install
```

## Deploying a new token

1. Customize configuration in `deployToken.ts`:
   - Set `PINATA_JWT` with your Pinata JWT token
   - Set `PRIVATE_WALLET_KEY` with your wallet's private key (base58)
   - Configure either `IMAGE_FILE_NAME` or `IMAGE_URL` for token image
   - Customize token parameters in `SAMPLE_TOKEN`

2. Run the deployment script:
```bash
yarn tsx local-key/solana/deployToken.ts
```

The script will create a new SPL token on Solana and output the transaction signature and mint address.
