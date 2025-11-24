# Bitbond Token Tool x Fireblocks
This directory contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

Fireblocks integration examples demonstrate how the key custody SDK can be utilized to execute transactions. The typical process involves invoking the contract call endpoint of Fireblocks API and passing the calldata payload. This sequence facilitates all the governence rules, including transaction authorization policy and approvals. A signed transaction is prepared for transmission to the blockchain node, a step that is automated by Fireblocks. In the case of token deployment, the contract call logic is executed by Token Tool smart contract, resulting in deployed token.

The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://sepolia.etherscan.io/tx/0xd7540a7025fc47dc4ebf3168b8de7384e613f71c3f6448b5af22767e9d4e938c)

## Requirements
Recommended:
- Node.js 22.11.0 or higher
- yarn 1.22.0 or higher

## Setup
1. Install [Node.js](https://nodejs.org/en) and [yarn](https://yarnpkg.com).
Exact installation steps depend on the platfrom, please refer to the documentation for instructions.
1. Install node packages:
```
yarn install
```
3. Copy API user key and private key created with Fireblocks into root directory of this repo.
Refer to `fireblocks_api_key.example` and `fireblocks_private_key.example` files to verify that
the format of the key matches values expected by the scripts.

## Token lifecycle actions
Two set of examples are given:
* Examples in this directory utilize Fireblocks SDK to make REST API calls
* Examples in `web3-provider-examples` directory use eip1193-compatible Fireblocks provider injected to Ethers.

### Deploying new token

1. Customize configuration in `fireblocks/evm/deployToken.ts`.
1. Customize `fireblocks/evm/deployToken.ts` to select the vault and chain that will be used for the deployment.
1. To deploy the token run:
```
yarn tsx ./fireblocks/evm/deployToken.ts
```

### Transferring tokens

1. Customize transfer parameters in `fireblocks/evm/transferTokens.ts`.
1. To transfer the tokens run:
```
yarn tsx ./fireblocks/evm/transferTokens.ts
```

### Minting tokens

1. Customize minting parameters in `fireblocks/evm/mintTokens.ts`.
1. To mint the tokens run:
```
yarn tsx ./fireblocks/evm/mintTokens.ts
```

### Burning tokens

1. Customize burning parameters in `fireblocks/evm/burnTokens.ts`.
1. To burn the tokens run:
```
yarn tsx ./fireblocks/evm/burnTokens.ts
```
