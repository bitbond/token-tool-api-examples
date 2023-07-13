import { ethers } from "ethers";

// Generate a random wallet
const wallet = ethers.Wallet.createRandom();

console.log(`Address: ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
