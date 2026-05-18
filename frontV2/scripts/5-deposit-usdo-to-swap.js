import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || 'https://11155111.rpc.thirdweb.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ADDRESSES = {
  SwapERC7984ToERC20: process.env.VITE_SWAP_CONTRACT_ADDRESS || '0xd7d9bEE6f279a646B3Dc6973f3f5efc40b098A6c',
  SalaryERC20: process.env.VITE_SALARY_ERC20_ADDRESS || '0xB5BDBaE38d418E5C915aFCa7c7048dF90E35b8E9',
};

const MINT_AMOUNT = ethers.parseUnits('10000', 6);

const SalaryERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const SwapERC7984ToERC20_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "depositERC20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('=== [5/5] Deposit USDO to SwapERC7984ToERC20 Contract ===');
  console.log(`Network: ${RPC_URL}`);
  console.log(`SwapERC7984ToERC20: ${CONTRACT_ADDRESSES.SwapERC7984ToERC20}`);
  console.log(`SalaryERC20 (USDO): ${CONTRACT_ADDRESSES.SalaryERC20}`);
  console.log(`Deposit Amount: ${ethers.formatUnits(MINT_AMOUNT, 6)} USDO`);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const account = await wallet.getAddress();
  
  console.log(`Using account: ${account}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(account))} ETH`);
  console.log('');

  const salaryERC20 = new ethers.Contract(CONTRACT_ADDRESSES.SalaryERC20, SalaryERC20_ABI, wallet);
  const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.SwapERC7984ToERC20, SwapERC7984ToERC20_ABI, wallet);

  // ============================================
  // Step 0: 检查合约所有者
  // ============================================
  console.log('Step 0: Checking Swap contract owner...');
  const owner = await swapContract.owner();
  console.log(`Swap contract owner: ${owner}`);
  console.log(`Current account: ${account}`);
  console.log(`Is owner: ${owner.toLowerCase() === account.toLowerCase()}`);
  console.log('');

  // ============================================
  // Step 1: 先铸造 USDO 到管理员账户
  // ============================================
  console.log('Step 1: Minting USDO to admin account...');
  const tx1 = await salaryERC20.mint(account, MINT_AMOUNT);
  console.log(`Tx hash: ${tx1.hash}`);
  const receipt1 = await tx1.wait();
  console.log(`✅ Confirmed in block ${receipt1.blockNumber}`);
  console.log('');

  // ============================================
  // Step 2: 授权 SwapERC7984ToERC20 花费 USDO
  // ============================================
  console.log('Step 2: Approving SwapERC7984ToERC20 to spend USDO...');
  const currentAllowance = await salaryERC20.allowance(account, CONTRACT_ADDRESSES.SwapERC7984ToERC20);
  console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDO`);
  
  if (currentAllowance < MINT_AMOUNT) {
    const tx2 = await salaryERC20.approve(CONTRACT_ADDRESSES.SwapERC7984ToERC20, ethers.MaxUint256);
    console.log(`Tx hash: ${tx2.hash}`);
    const receipt2 = await tx2.wait();
    console.log(`✅ Confirmed in block ${receipt2.blockNumber}`);
  } else {
    console.log('✅ Allowance already sufficient');
  }
  console.log('');

  // ============================================
  // Step 3: 检查 SwapERC7984ToERC20 的 USDO 余额
  // ============================================
  console.log('Step 3: Checking Swap contract USDO balance before deposit...');
  const balanceBefore = await salaryERC20.balanceOf(CONTRACT_ADDRESSES.SwapERC7984ToERC20);
  console.log(`Current balance: ${ethers.formatUnits(balanceBefore, 6)} USDO`);
  console.log('');

  // ============================================
  // Step 4: 调用 depositERC20 将 USDO 存入 Swap 合约
  // ============================================
  console.log('Step 4: Depositing USDO to SwapERC7984ToERC20...');
  const tx3 = await swapContract.depositERC20(MINT_AMOUNT);
  console.log(`Tx hash: ${tx3.hash}`);
  const receipt3 = await tx3.wait();
  console.log(`✅ Confirmed in block ${receipt3.blockNumber}`);
  console.log('');

  // ============================================
  // Step 5: 验证余额
  // ============================================
  console.log('Step 5: Verifying final balance...');
  const balanceAfter = await salaryERC20.balanceOf(CONTRACT_ADDRESSES.SwapERC7984ToERC20);
  console.log(`Final balance: ${ethers.formatUnits(balanceAfter, 6)} USDO`);
  console.log('');

  console.log('=== Deposit completed successfully! ===');
}

main().catch(e => { console.error('Error:', e); process.exit(1); });