# FHE Payroll System

Confidential Payroll Infrastructure is a privacy based payroll and financial identity system for Web3 organizations, built on Zama's Fully Homomorphic Encryption (FHE).
This system allows enterprises to complete salary payments on the chain while default protecting salary data privacy. Sensitive information such as salary amount, company salary structure, and employee income will be stored in encrypted form, and only authorized users can decrypt and view it.
Our goal is to build a privacy employment and financial identity infrastructure in the on chain economy.

## 📁 Project Structure

```
├── contracts/
│   ├── FheSalarySystem.sol       # FHE Salary System Main Contract
│   └── SalaryToken.sol           # ERC20 Salary Token
├── scripts/
│   └── deploy.js                # Deployment Script
├── front/                       # Frontend (not in scope)
├── hardhat.config.js            # Hardhat Configuration
├── .env                         # Environment Variables
├── package.json                 # Project Dependencies
└── README.md                    # This Document
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

## 🔧 Configuration

### Environment Variables

Configure your private key in `.env` file:

```env
PRIVATE_KEY=your_private_key_here
```

### Hardhat Configuration

Configure networks in `hardhat.config.js`:

```javascript
require("@fhevm/hardhat-plugin");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    zamaSepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura or Alchemy node URL
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
```

**Configuration Details:**
- `url`: RPC node URL, can use Infura, Alchemy, or other services
- `accounts`: Deployer's private key (read from .env file)
- `chainId`: Sepolia testnet chain ID is 11155111

## 🌐 Sepolia Deployment

### 1. Get Test ETH

Before deploying, ensure your wallet has enough Sepolia test ETH. You can get it from these faucets:
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### 2. Update hardhat.config.js

Make sure you have the correct RPC URL and private key configured:

```javascript
zamaSepolia: {
  url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 11155111,
}
```

### 3. Execute Deployment

```bash
npx hardhat run scripts/deploy.js --network zamaSepolia
```

### 4. Deployment Output Example

```
Deploying with: 0x123456...
SalaryToken: 0x...
FheSalarySystem: 0x...
```
### 5. sepolia test address
FheSalarySystem: 0xc019cEB21628EFaa14A20a50D5EE2cE727F52d88
SalaryToken:0x17B865ef552d869BF802c333F75a987d8c2bD332
```
## 📝 Contract Features

### 1. Employee Management
- Add employees (admin only)
- Employee information storage (name, email, address)
- Employee list query

### 2. Salary Distribution
- Single employee encrypted salary distribution
- Batch employee encrypted salary distribution
- Homomorphic encryption salary accumulation
- Salary distribution records

### 3. Employee Features
- View own encrypted salary
- Withdraw salary
- Query own distribution records

### 4. Admin Features
- Pause/resume contract
- Deposit tokens
- View all distribution records
- Query all employee lists

## 🔐 FHE Features

- Salary data encrypted using Zama FHE
- Salary data stored encrypted end-to-end
- Homomorphic encryption operations
- Only authorized users can decrypt

## 📚 Contract Details

### SalaryToken
- Based on OpenZeppelin ERC20 standard
- Token symbol: USDO
- Decimals: 6
- Initial supply: 1,000,000 USDO
- Supports minting and burning

### FheSalarySystem
- Implemented based on Zama fhEVM
- Uses euint64 for encrypted salary data
- Plaintext/ciphertext separation design
- Complete access control

## 🎯 Next Steps

1. After successful deployment, update contract addresses in frontend configuration
2. Use admin account to deposit tokens to the salary contract
3. Add employees and start distributing salaries

## 🔗 Reference Links

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Sepolia Testnet](https://sepolia.etherscan.io)
