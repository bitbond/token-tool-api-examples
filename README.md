# Bitbond Token Tool API examples
A collection of script samples illustrating interacting with Bitbond Token Tool
contracts. The example uses TypeScript, but can also be converted to pure
JavaScript by removing type definitions.

Example token deployment: [Block explorer](https://mumbai.polygonscan.com/tx/0xd366367005e841cc97e0ffd02002114dfae41222559116b54f56298d45bf057d)

## Requirements
- Node 18.16.0
- yarn v1

## Setup

Copy API user key and secret created with your custody provider (Fireblocks) into this directory.
Refer to `fireblocks_key.example` and `fireblocks_secret.example` to verify that
the format of the key matches values expected by the script.

Install node packages:

```
yarn
```

Configure token which is going to be deployed by editing `config.ts` file.

## Fireblocks

1. Review token configuration in `config.ts`.
1. Review Fireblocks configuration in `config.ts` to select Fireblocks vault and chain.
1. To deploy the token run:
```
npx ts-node ./fireblocks/deployToken.ts <fireblocks_key_file> <fireblocks_secret_file>
```
