import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || 'https://11155111.rpc.thirdweb.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ADDRESSES = {
  SwapERC7984ToERC20: process.env.VITE_SWAP_CONTRACT_ADDRESS || '0xd7A388EbB1079e90F01cfa64cf57271eb6342d22',
  SalaryToken: process.env.VITE_SALARY_TOKEN_ADDRESS || '0x074bC24Ce0e5Aa5Bc502Edf81C8CA05f85250091',
  SalaryERC20: process.env.VITE_SALARY_ERC20_ADDRESS || '0xB346F225bDCE18bd0090a401b564738f91748dE3',
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

const SalaryERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('=== [4/4] Authorize SwapERC7984ToERC20 Contract ===');
  console.log(`Network: ${RPC_URL}`);
  console.log(`SwapERC7984ToERC20: ${CONTRACT_ADDRESSES.SwapERC7984ToERC20}`);
  console.log(`SalaryToken (CUSDO): ${CONTRACT_ADDRESSES.SalaryToken}`);
  console.log(`SalaryERC20 (USDO): ${CONTRACT_ADDRESSES.SalaryERC20}`);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const account = await wallet.getAddress();
  
  console.log(`Using account: ${account}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(account))} ETH`);
  console.log('');

  // ============================================
  // Step 1: 授权 SwapERC7984ToERC20 操作 CUSDO (ERC7984)
  // ============================================
  console.log('Step 1: Authorizing SwapERC7984ToERC20 to spend CUSDO (ERC7984)...');
  const salaryToken = new ethers.Contract(CONTRACT_ADDRESSES.SalaryToken, SalaryToken_ABI, wallet);
  
  const maxUint48 = '0xffffffffffff';
  const tx1 = await salaryToken.setOperator(CONTRACT_ADDRESSES.SwapERC7984ToERC20, maxUint48);
  console.log(`Tx hash: ${tx1.hash}`);
  const receipt1 = await tx1.wait();
  console.log(`✅ Confirmed in block ${receipt1.blockNumber}`);
  console.log('');

  // ============================================
  // Step 2: 授权 SwapERC7984ToERC20 操作 USDO (ERC20)
  // ============================================
  console.log('Step 2: Authorizing SwapERC7984ToERC20 to spend USDO (ERC20)...');
  const salaryERC20 = new ethers.Contract(CONTRACT_ADDRESSES.SalaryERC20, SalaryERC20_ABI, wallet);
  
  const tx2 = await salaryERC20.approve(CONTRACT_ADDRESSES.SwapERC7984ToERC20, ethers.MaxUint256);
  console.log(`Tx hash: ${tx2.hash}`);
  const receipt2 = await tx2.wait();
  console.log(`✅ Confirmed in block ${receipt2.blockNumber}`);
  console.log('');

  console.log('=== All authorizations completed! ===');
}

main().catch(e => { console.error('Error:', e); process.exit(1); });