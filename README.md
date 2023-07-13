# Bitbond Token Tool API examples
This repository contains a suite of script samples that demonstrate how to
programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

Fireblocks integration examples demonstrate how the custody SDK can be utilized to execute transactions. Additional examples covering other custodians will be included gradually. For custodians that do not offer a dedicated SDK, it is often possible to achieve similar outcomes by directly utilizing the custodian’s API. The typical process involves invoking the contract call endpoint of the custodian’s API and passing the calldata payload. This sequence facilitates the creation of a signed transaction that is prepared for transmission to the blockchain node, a step that numerous custody providers automate. In the case of token deployment, the logic is executed by Token Tool smart contract, resulting in the deployment of the token.

The `./custodyAgnostic` examples can be adapted to different custody providers.
Those examples are intended as a simple illustration of API interaction, for production use we strongly advise employing a secure key custody solution.

The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://mumbai.polygonscan.com/tx/0xd366367005e841cc97e0ffd02002114dfae41222559116b54f56298d45bf057d)

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

### Custody-agnostic examples
Copy private key into root directory of this repo. If you want to create a random wallet run:
```
npx ts-node ./custodyAgnostic/createWallet.ts
```
Please refer to `private_key.example` file to verify that the format of the key
matches values expected by the scripts.

## Token lifecycle actions

### Deploying new token

Replace `<custody>` with `fireblocks` or `custodyAgnostic`:
1. Customize configuration in `<custody>/deployToken.ts`.
1. (Fireblocks optional) Customize `fireblocks/deployToken.ts` to select the vault and chain that will used for the deployment.
1. To deploy the token run:
```
npx ts-node ./<custody>/deployToken.ts
```

### Transferring tokens

Replace `<custody>` with `fireblocks` or `custodyAgnostic`:
1. Customize transfer parameters in `<custody>/transferTokens.ts`.
1. To transfer the tokens run:
```
npx ts-node ./<custody>/transferTokens.ts
```

### Minting tokens

Replace `<custody>` with `fireblocks` or `custodyAgnostic`:
1. Customize minting parameters in `<custody>/mintTokens.ts`.
1. To mint the tokens run:
```
npx ts-node ./<custody>/mintTokens.ts
```

### Buring tokens

Replace `<custody>` with `fireblocks` or `custodyAgnostic`:
1. Customize burning parameters in `<custody>/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./<custody>/burnTokens.ts
```
