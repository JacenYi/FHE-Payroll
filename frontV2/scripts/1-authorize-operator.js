import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ADDRESSES = {
  SalaryToken: process.env.VITE_SALARY_TOKEN_ADDRESS || '0x074bC24Ce0e5Aa5Bc502Edf81C8CA05f85250091',
  FheSalarySystem: process.env.VITE_CONTRACT_ADDRESS || '0x93E77dE9198afcc3E3b59aaAFEb5AE51BE2EAdAA',
};

const SalaryToken_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "uint48", "name": "expiresAt", "type": "uint48"}],
    "name": "setOperator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('=== [1/3] Authorize FheSalarySystem as SalaryToken Operator ===');
  console.log(`Network: ${RPC_URL}`);
  console.log(`SalaryToken: ${CONTRACT_ADDRESSES.SalaryToken}`);
  console.log(`FheSalarySystem: ${CONTRACT_ADDRESSES.FheSalarySystem}`);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const account = await wallet.getAddress();
  
  console.log(`Using account: ${account}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(account))} ETH`);
  console.log('');

  const salaryToken = new ethers.Contract(CONTRACT_ADDRESSES.SalaryToken, SalaryToken_ABI, wallet);

  console.log('Authorizing FheSalarySystem to spend SalaryToken...');
  const maxUint48 = '0xffffffffffff';
  const tx = await salaryToken.setOperator(CONTRACT_ADDRESSES.FheSalarySystem, maxUint48);
  console.log(`Tx hash: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  console.log('');
}

main().catch(e => { console.error('Error:', e); process.exit(1); });