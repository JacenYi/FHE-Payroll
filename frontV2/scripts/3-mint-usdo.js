import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ADDRESSES = {
  SalaryERC20: process.env.VITE_SALARY_ERC20_ADDRESS || '0xB346F225bDCE18bd0090a401b564738f91748dE3',
  FheSalarySystem: process.env.VITE_CONTRACT_ADDRESS || '0x93E77dE9198afcc3E3b59aaAFEb5AE51BE2EAdAA',
};

const MINT_AMOUNT = 10000;

const SalaryERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('=== [3/3] Mint USDO (ERC20) to FheSalarySystem ===');
  console.log(`Network: ${RPC_URL}`);
  console.log(`SalaryERC20: ${CONTRACT_ADDRESSES.SalaryERC20}`);
  console.log(`FheSalarySystem: ${CONTRACT_ADDRESSES.FheSalarySystem}`);
  console.log(`Mint amount: ${MINT_AMOUNT} USDO`);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const account = await wallet.getAddress();
  
  console.log(`Using account: ${account}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(account))} ETH`);
  console.log('');

  const salaryERC20 = new ethers.Contract(CONTRACT_ADDRESSES.SalaryERC20, SalaryERC20_ABI, wallet);

  console.log(`Minting ${MINT_AMOUNT} USDO to FheSalarySystem...`);
  const tx = await salaryERC20.mint(CONTRACT_ADDRESSES.FheSalarySystem, ethers.parseUnits(MINT_AMOUNT.toString(), 18));
  console.log(`Tx hash: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  console.log('');

  const balance = await salaryERC20.balanceOf(CONTRACT_ADDRESSES.FheSalarySystem);
  console.log(`FheSalarySystem USDO balance: ${ethers.formatUnits(balance, 18)}`);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });