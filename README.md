# Bitbond Token Tool API examples
A collection of script samples illustrating interacting with Bitbond Token Tool
contracts. The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://mumbai.polygonscan.com/tx/0xd366367005e841cc97e0ffd02002114dfae41222559116b54f56298d45bf057d)

## Requirements
Recommended:
- Node.js 18.16.0 or higher
- npm 9.5.1 or higher

## Setup
1. Install [Node.js](https://nodejs.org/en) and [npm](https://npmjs.com).
Exact installation steps depend on the platfrom, please refer to the documentation for instructions.
1. Copy API key and private key created with your custody provider (Fireblocks) into this directory.
Refer to `fireblocks_key.example` and `fireblocks_secret.example` files to verify that
the format of the key matches values expected by the scripts.
1. Install node packages:

```
npm install
```

## Fireblocks
### Deploying new token

1. Customize token configuration in `fireblocks/deployToken.ts`.
1. Customize Fireblocks configuration in `fireblocks/deployToken.ts` to select
Fireblocks vault and chain that will used for the deployment.
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

### Buring tokens

1. Customize burning parameters in `fireblocks/burnTokens.ts`.
1. To burn the tokens run:
```
npx ts-node ./fireblocks/burnTokens.ts
```
