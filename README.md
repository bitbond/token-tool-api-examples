![Bitbond logo](docs/bitbond-logo.png)

# Bitbond Token Tool API examples
This repository contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

Fireblocks integration examples demonstrate how the key custody SDK can be utilized to execute transactions. Additional examples covering other key custodians will be included gradually. For key custodians that do not offer a dedicated SDK, it is often possible to achieve similar outcomes by directly utilizing key custodian’s API. The typical process involves invoking the contract call endpoint of key custodian’s API and passing the calldata payload. This sequence facilitates the creation of a signed transaction that is prepared for transmission to the blockchain node, a step that numerous key custody providers automate. In the case of token deployment, the logic is executed by Token Tool smart contract, resulting in the deployment of the token.

The `./localKey` examples can be adapted to different key custody providers.
Those examples are intended as a simple illustration of interaction with smart contract's API, for production use we strongly advise employing a secure key custody solution.

The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://mumbai.polygonscan.com/tx/0xd366367005e841cc97e0ffd02002114dfae41222559116b54f56298d45bf057d)

![Token creation diagram](docs/creation-diagram.jpg)

## Requirements
Recommended:
- Node.js 18.16.0 or higher
- npm 9.5.1 or higher

## Setup
Shared setups steps, regardless of selected key custody:
1. Install [Node.js](https://nodejs.org/en) and [npm](https://npmjs.com).
Exact installation steps depend on the platfrom, please refer to the documentation for instructions.
1. Install node packages:
```
npm install
```

### Fireblocks examples
Copy API user key and private key created with Fireblocks into root directory of this repo.
Refer to `fireblocks_key.example` and `fireblocks_secret.example` files to verify that
the format of the key matches values expected by the scripts.

### Local key examples
Copy private key into root directory of this repo. If you want to create a random wallet run:
```
npx ts-node ./localKey/createWallet.ts
```
Please refer to `private_key.example` file to verify that the format of the key
matches values expected by the scripts.

## Token lifecycle actions

### Deploying new token

Replace `<key-custody>` with `fireblocks` or `localKey`:
1. Customize configuration in `<key-custody>/deployToken.ts`.
1. (Fireblocks optional) Customize `fireblocks/deployToken.ts` to select the vault and chain that will be used for the deployment.
1. To deploy the token run:
```
npx ts-node ./<key-custody>/deployToken.ts
```

### Transferring tokens

Replace `<key-custody>` with `fireblocks` or `localKey`:
1. Customize transfer parameters in `<key-custody>/transferTokens.ts`.
1. To transfer the tokens run:
```
npx ts-node ./<key-custody>/transferTokens.ts
```

### Minting tokens

Replace `<key-custody>` with `fireblocks` or `localKey`:
1. Customize minting parameters in `<key-custody>/mintTokens.ts`.
1. To mint the tokens run:
```
npx ts-node ./<key-custody>/mintTokens.ts
```

### Burning tokens

Replace `<key-custody>` with `fireblocks` or `localKey`:
1. Customize burning parameters in `<key-custody>/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./<key-custody>/burnTokens.ts
```
