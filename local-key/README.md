# Bitbond Token Tool API examples
This repository contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

The examples in this directory can be adapted to different key custody providers.
Those scripts are intended as a simple illustration of interaction with smart contract's API, for production use we strongly advise employing a secure key custody solution. Please refer to the main README for examples covering enterprise-grade key custodians.

For example, key custody SDK can be utilized to execute transactions. For key custodians that do not offer a dedicated SDK, it is often possible to achieve similar outcomes by directly utilizing key custodian’s API. The typical process involves invoking the contract call endpoint of key custodian’s API and passing the calldata payload. This sequence facilitates the creation of a signed transaction that is prepared for transmission to the blockchain node, a step that numerous key custody providers automate. In the case of token deployment, the logic is executed by Token Tool smart contract, resulting in the deployment of the token.

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
3. Copy private key into root directory of this repo. If you want to create a random wallet run:
```
npx ts-node ./local-key/createWallet.ts
```
Please refer to `private_key.example` file to verify that the format of the key
matches values expected by the scripts.

## Token lifecycle actions

### Deploying new token

1. Customize configuration in `local-key/deployToken.ts`.
1. To deploy the token run:
```
npx ts-node ./local-key/deployToken.ts
```

### Transferring tokens

1. Customize transfer parameters in `local-key/transferTokens.ts`.
1. To transfer the tokens run:
```
npx ts-node ./local-key/transferTokens.ts
```

### Minting tokens

1. Customize minting parameters in `local-key/mintTokens.ts`.
1. To mint the tokens run:
```
npx ts-node ./local-key/mintTokens.ts
```

### Burning tokens

1. Customize burning parameters in `local-key/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./local-key/burnTokens.ts
```
