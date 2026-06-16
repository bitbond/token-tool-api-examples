# Bitbond Token Tool API examples
This repository contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

The examples in this directory can be adapted to different key custody providers.
Those scripts are intended as a simple illustration of interaction with smart contract's API, for production use we strongly advise employing a secure key custody solution. Please refer to the main README for examples covering enterprise-grade key custodians.

For example, key custody SDK can be utilized to execute transactions. For key custodians that do not offer a dedicated SDK, it is often possible to achieve similar outcomes by directly utilizing key custodian’s API. The typical process involves invoking the contract call endpoint of key custodian’s API and passing the calldata payload. This sequence facilitates the creation of a signed transaction that is prepared for transmission to the blockchain node, a step that numerous key custody providers automate. In the case of token deployment, the logic is executed by Token Tool smart contract, resulting in the deployment of the token.

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
3. Copy private key into root directory of this repo. If you want to create a random wallet run:
```
yarn tsx ./local-key/evm/createWallet.ts
```
Please refer to `private_key.example` file to verify that the format of the key
matches values expected by the scripts.

## Token lifecycle actions

### Deploying new token

1. Customize configuration in `local-key/evm/deployToken.ts`.
1. To deploy the token run:
```
yarn tsx ./local-key/evm/deployToken.ts
```
On success the script prints the deployed token address (parsed from the
factory's `ContractDeployed` event). Keep it - you'll need it to verify the
token (see below).

### Transferring tokens

1. Customize transfer parameters in `local-key/evm/transferTokens.ts`.
1. To transfer the tokens run:
```
yarn tsx ./local-key/evm/transferTokens.ts
```

### Minting tokens

1. Customize minting parameters in `local-key/evm/mintTokens.ts`.
1. To mint the tokens run:
```
yarn tsx ./local-key/evm/mintTokens.ts
```

### Burning tokens

1. Customize burning parameters in `local-key/evm/burnTokens.ts`.
1. To burn the tokens run:
```
yarn tsx ./local-key/evm/burnTokens.ts
```

### Verifying a deployed token

Verification publishes the token's source code on the block explorer (e.g.
Etherscan) so it shows up as "verified". You only need to provide the deployed
token address - the script handles the verification request for you.

1. Set `CONTRACT_ADDRESS` (the deployed token address printed by
   `deployToken.ts`), `CHAIN_ID` and `contractName` in
   `local-key/evm/verifyToken.ts`. The `contractName` must match the one used
   when the token was deployed (see `deployToken.ts`).
1. To verify the token run:
```
yarn tsx ./local-key/evm/verifyToken.ts
```
The script polls the block explorer until verification succeeds or fails.
