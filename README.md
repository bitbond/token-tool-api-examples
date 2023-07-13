# Bitbond Token Tool API examples
A collection of script samples illustrating interacting with Bitbond Token Tool
contracts. Please refer to Token Tool product documentation for more details:
[https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool)

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
Those examples are intended to as a most basic illustration of API interaction.
For production use we strongly advice to use a secure key custody solution. This
general example can be adapted to different custody providers that allows
programatic contract calls to a specified destination with `calldata` payload.

#### Setup:
Copy private key into root directory of this repo. If you want to create a random wallet run:
```
npx ts-node ./custodyAgnostic/createWallet.ts
```
Please refer to `private_key.example` file to verify that the format of the key
matches values expected by the scripts.

### Deploying new token

Replace <custody> with `fireblocks` or `custodyAgnostic`:
1. Customize configuration in `<custody>/deployToken.ts`.
1. (optional) If using Fireblocks configuration in `fireblocks/deployToken.ts` to select the vault and chain that will used for the deployment.
1. To deploy the token run:
```
npx ts-node ./<custody>/deployToken.ts
```

### Transferring tokens

Replace <custody> with `fireblocks` or `custodyAgnostic`:
1. Customize transfer parameters in `<custody>/transferTokens.ts`.
1. To transfer the tokens run:
```
npx ts-node ./<custody>/transferTokens.ts
```

### Minting tokens

Replace <custody> with `fireblocks` or `custodyAgnostic`:
1. Customize minting parameters in `<custody>/mintTokens.ts`.
1. To mint the tokens run:
```
npx ts-node ./<custody>/mintTokens.ts
```

### Buring tokens

Replace <custody> with `fireblocks` or `custodyAgnostic`:
1. Customize burning parameters in `<custody>/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./<custody>/burnTokens.ts
```
