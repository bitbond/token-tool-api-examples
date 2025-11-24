# Bitbond Token Tool x Metaco Harmonize
This directory contains a suite of script samples that demonstrate how to programmatically interact with Bitbond Token Tool contracts. Refer to [Token Tool product documentation](https://docs.bitbond.com/asset-tokenization-suite/token-tool/intro-token-tool) for additional context.

Metaco integration examples demonstrate how the key custody API can be utilized to execute transactions. The typical process involves:
1. Using the Bitbond Token Tool API to generate transaction data (calldata)
2. Invoking the Harmonize API contract call endpoint with the generated calldata
3. Harmonize creates a signed transaction that is ready for transmission to the blockchain node

In the case of token deployment, the transaction calls the Token Tool factory smart contract, which deploys your configured token.

## API / UI
Examples below illustrate programmatic mode of interaction that is best suited for large-scale operations. The same actions at a smaller scale can be conveniently executed using either Token Tool UI connected to Harmonize through Wallet Connect, or Harmonize UI itself.

Example token deployment: [Block explorer](https://sepolia.etherscan.io/tx/0xd7540a7025fc47dc4ebf3168b8de7384e613f71c3f6448b5af22767e9d4e938c)

![Token creation diagram](../../docs/creation-diagram.jpg)

## Requirements
- Node.js 22.11.0 or higher
- npm 10.0.0 or higher (or yarn)

## Setup
1. Install [Node.js](https://nodejs.org/en) and [npm](https://npmjs.com) or [yarn](https://yarnpkg.com).
   Exact installation steps depend on the platform, please refer to the documentation for instructions.
2. Install node packages:
```bash
yarn install
# or
npm install
```
3. Follow Harmonize setup instructions to create an API user.

## Token lifecycle actions

### Deploying new token

1. Customize configuration in `deployToken.ts`:
   - Set `ISSUER_ADDRESS` to your wallet address
   - Configure `CHAIN_ID` for your target network (e.g., 11155111 for Sepolia)
   - Update token parameters (name, symbol, supply, etc.)
   - Set token properties (mintable, burnable, pausable, etc.)

2. Generate the deployment transaction data:
```bash
npx tsx metaco/evm/deployToken.ts
```

3. The script will output:
   - **Factory Address**: The Token Tool factory contract address
   - **Transaction Data (Calldata)**: The encoded function call
   - **Transaction Value (Wei)**: The amount to send with the transaction

4. Use these values with Metaco Harmonize API:
   - Create a `v0_CreateTransactionOrder` intent
   - Set destination address to the **Factory Address**
   - Set data to the **Transaction Data (Calldata)**
   - Set value to the **Transaction Value**
   - Refer to [Harmonize documentation](https://docs.metaco.cloud/) for API details

### Transferring tokens

1. Customize transfer parameters in `transferTokens.ts`:
   - Set `AMOUNT_TO_TRANSFER` to the amount of tokens to send
   - Set `TOKEN_DECIMALS` to match your token's decimals
   - Set `RECIPIENT_ADDRESS` to the destination address

2. Generate the transfer calldata:
```bash
npx tsx metaco/evm/transferTokens.ts
```

3. Use the output with Metaco Harmonize API:
   - Create a `v0_CreateTransactionOrder` intent
   - Set destination to your **token contract address**
   - Set data to the generated calldata
   - Refer to [Harmonize documentation](https://docs.metaco.cloud/) for API details

### Minting tokens

1. Customize minting parameters in `mintTokens.ts`:
   - Set `AMOUNT_TO_MINT` to the amount of tokens to mint
   - Set `TOKEN_DECIMALS` to match your token's decimals
   - Set `RECIPIENT_ADDRESS` to the address receiving the tokens

2. Generate the mint calldata:
```bash
npx tsx metaco/evm/mintTokens.ts
```

3. Use the output with Metaco Harmonize API:
   - Create a `v0_CreateTransactionOrder` intent
   - Set destination to your **token contract address**
   - Set data to the generated calldata
   - Refer to [Harmonize documentation](https://docs.metaco.cloud/) for API details

### Burning tokens

1. Customize burning parameters in `burnTokens.ts`:
   - Set `AMOUNT_TO_BURN` to the amount of tokens to burn
   - Set `TOKEN_DECIMALS` to match your token's decimals

2. Generate the burn calldata:
```bash
npx tsx metaco/evm/burnTokens.ts
```

3. Use the output with Metaco Harmonize API:
   - Create a `v0_CreateTransactionOrder` intent
   - Set destination to your **token contract address**
   - Set data to the generated calldata
   - Refer to [Harmonize documentation](https://docs.metaco.cloud/) for API details
