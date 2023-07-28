# Bitbond Token Tool x Fireblocks
This directory contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

Fireblocks integration examples demonstrate how the key custody SDK can be utilized to execute transactions. The typical process involves invoking the contract call endpoint of Fireblocks API and passing the calldata payload. This sequence facilitates all the governence rules, including transaction authorization policy and approvals. A signed transaction is prepared for transmission to the blockchain node, a step that is automated by Fireblocks. In the case of token deployment, the contract call logic is executed by Token Tool smart contract, resulting in deployed token.

The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://mumbai.polygonscan.com/tx/0xd366367005e841cc97e0ffd02002114dfae41222559116b54f56298d45bf057d)

## Requirements
Recommended:
- Node.js 18.16.0 or higher
- npm 9.5.1 or higher

## Setup
1. Install [Node.js](https://nodejs.org/en) and [npm](https://npmjs.com).
Exact installation steps depend on the platfrom, please refer to the documentation for instructions.
1. Install node packages:
```
npm install
```
3. Copy API user key and private key created with Fireblocks into root directory of this repo.
Refer to `fireblocks_key.example` and `fireblocks_secret.example` files to verify that
the format of the key matches values expected by the scripts.

## Token lifecycle actions
Two set of examples are given:
* Examples in this directory utilize Fireblocks SDK to make REST API calls
* Examples in `web3-provider` directory use eip1193-compatible Fireblocks provider injected to Ethers.

### Deploying new token

1. Customize configuration in `fireblocks/deployToken.ts`.
1. Customize `fireblocks/deployToken.ts` to select the vault and chain that will be used for the deployment.
1. To deploy the token run:
```
npx ts-node ./fireblocks/deployToken.ts
```

### Transferring tokens

1. Customize transfer parameters in `fireblocks/transferTokens.ts`.
1. To transfer the tokens run:
```
npx ts-node ./fireblocks/transferTokens.ts
```

### Minting tokens

1. Customize minting parameters in `fireblocks/mintTokens.ts`.
1. To mint the tokens run:
```
npx ts-node ./fireblocks/mintTokens.ts
```

### Burning tokens

1. Customize burning parameters in `fireblocks/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./fireblocks/burnTokens.ts
```
