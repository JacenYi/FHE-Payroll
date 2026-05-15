# FHE Salary System V2

A fully homomorphic encryption (FHE) salary management system built on Zama's fhEVM, featuring ERC7984 confidential tokens and a confidential-to-plaintext swap mechanism.

## What's New in V2

| Feature | V1 | V2 |
|---------|----|----|
| Salary Token | Plain ERC20 | ERC7984 Confidential Token |
| Salary Data | Stored in plaintext (Simple) / encrypted (FHE) | Fully encrypted on-chain via fhEVM |
| Withdrawal | Direct ERC20 transfer | Confidential → ERC20 swap with decryption proof |
| Token Swap | Not supported | SwapERC7984ToERC20 bridge contract |
| FHE Compliance | Partial | Full fhEVM compliance with proper access controls |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin (Employer)                         │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Deposit ERC7984│  │ Send Encrypted   │  │ Batch Send       │  │
│  │ to System     │  │ Salary           │  │ Encrypted Salary │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
└─────────┼───────────────────┼──────────────────────┼────────────┘
          │                   │                      │
          ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FheSalarySystem                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Encrypted       │  │ Employee       │  │ Salary Records   │  │
│  │ Contract Balance│  │ Management     │  │ (Encrypted)      │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                          │                                      │
│                          │ confidentialTransferFrom              │
│                          ▼                                      │
│                  ┌───────────────┐                              │
│                  │  SalaryToken  │  (ERC7984)                   │
│                  │  CUSDO        │                              │
│                  └───────┬───────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │ Employee       │                │
          │ views balance  │                │
          │ (encrypted)    │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SwapERC7984ToERC20                            │
│  ┌─────────────────┐    ┌──────────────────┐                    │
│  │ 1. Request Swap │───▶│ 2. Decrypt &     │───▶ SalaryERC20   │
│  │ (confidential)  │    │    Finalize      │     (USDO ERC20)  │
│  └─────────────────┘    └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── contracts/
│   ├── FheSalarySystem.sol        # Core salary management contract (FHE)
│   ├── SalaryToken.sol            # ERC7984 confidential salary token (CUSDO)
│   ├── SalaryERC20.sol            # Plain ERC20 token (USDO) for swap output
│   ├── SwapERC7984ToERC20.sol     # Confidential-to-plain token swap bridge
├── scripts/
│   ├── deployV2.js                # ContractsV2 deployment
│   ├── deploy.js                  # Contracts deployment
├── test/
│   ├── CompleteSystem.test.js     # Full system integration tests
│   └── FheSalarySystem.test.js    # Salary system unit tests
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Project dependencies
└── README.md                      # This file
```

## Smart Contracts

### FheSalarySystem

The core salary management contract with full FHE encryption.

**Key Features:**
- Employee management (add, query, role-based access)
- Encrypted salary deposit and distribution
- Batch salary payments
- Encrypted balance tracking per employee
- Salary record history
- Contract pause mechanism

**Access Control:**
| Role | Capabilities |
|------|-------------|
| Admin | Add employees, deposit tokens, send salary, pause contract |
| Employee | View own encrypted balance, withdraw, view own salary records |
| None | No access |

**Core Functions:**
| Function | Access | Description |
|----------|--------|-------------|
| `addEmployee()` | Admin | Register a new employee |
| `depositTokens()` | Admin | Deposit encrypted tokens into the system |
| `depositTokensEncrypted()` | Admin | Deposit using client-side encrypted input |
| `sendEncryptedSalary()` | Admin | Send encrypted salary to an employee |
| `batchSendEncryptedSalary()` | Admin | Batch send encrypted salaries |
| `withdraw()` | Employee | Request withdrawal of encrypted balance |
| `getEncryptedBalance()` | Employee | View own encrypted salary balance |
| `getMySalaryRecords()` | Employee | View own salary history |
| `getAllSalaryRecords()` | Admin | View all salary records |
| `getAllEmployees()` | Admin | View all employee details |
| `pauseContract()` | Admin | Pause/resume the contract |

### SalaryToken (ERC7984 - CUSDO)

A confidential token implementing the ERC7984 standard, powered by Zama's fhEVM.

**Key Features:**
- All balances and transfers are fully encrypted on-chain
- Supports both plaintext and confidential minting
- Supports both plaintext and confidential burning
- 6 decimal precision
- Owner-controlled minting with `Ownable2Step`

### SalaryERC20 (USDO)

A standard ERC20 token that serves as the plaintext output of the swap mechanism.

- Standard ERC20 with 6 decimals
- Owner-controlled mint and burn
- Acts as the "withdrawable" version of the confidential salary token

### SwapERC7984ToERC20

A bridge contract that converts confidential ERC7984 tokens to plain ERC20 tokens through a two-phase process.

**Swap Flow:**
1. **Request Phase** — Employee calls `swapConfidentialToERC20()` with an encrypted amount. The contract transfers the confidential tokens from the user, makes the amount publicly decryptable, and creates a pending swap record.
2. **Finalization Phase** — After the threshold decryption completes, anyone can call `finalizeSwap()` with the decryption proof. The contract verifies the proof and transfers the equivalent plain ERC20 tokens to the employee.

**Security:**
- Decryption proof verification via `FHE.checkSignatures`
- Pending swap tracking with unique swap IDs
- Only the swap receiver receives the ERC20 tokens

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Contracts

```bash
npm run compile
```

### 3. Run Tests

```bash
npm test
```

### 4. Deploy (Local)

```bash
npx hardhat node
npx hardhat run scripts/deployComplete.js --network localhost
```

### 5. Deploy (Sepolia Testnet)

Configure your `.env` file:

```
PRIVATE_KEY=your_private_key_here
```

Then deploy:

```bash
npx hardhat run scripts/deployComplete.js --network sepolia
```

## Deployment Workflow

The recommended deployment order (as documented in `DeploymentExample.sol`):

1. Deploy `SalaryERC20` (plain ERC20)
2. Deploy `SalaryToken` (ERC7984 confidential token)
3. Deploy `SwapERC7984ToERC20` (swap bridge)
4. Deploy `FheSalarySystem` (salary management)
5. Set operator permissions on `SalaryToken` for the salary system
6. Deposit ERC20 liquidity into the swap contract
7. Begin using the system

## Complete Business Flow

```
Admin Setup:
  1. Deploy all contracts
  2. Call salaryToken.setOperator(fheSalarySystem, MAX)
  3. Deposit ERC20 liquidity into SwapERC7984ToERC20
  4. Deposit ERC7984 tokens into FheSalarySystem

Salary Payment:
  5. Admin adds employees
  6. Admin sends encrypted salary (single or batch)

Employee Withdrawal:
  7. Employee calls salaryToken.setOperator(swapContract, MAX)
  8. Employee calls swapContract.swapConfidentialToERC20(encryptedAmount, proof)
  9. Wait for decryption threshold
  10. Call swapContract.finalizeSwap(swapId, clearAmount, decryptionProof)
  11. Employee receives plain ERC20 (USDO) tokens
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| FHE Library | Zama fhEVM (`@fhevm/solidity`) |
| Confidential Token Standard | ERC7984 (`@openzeppelin/confidential-contracts`) |
| Standard Token | ERC20 (`@openzeppelin/contracts`) |
| Development Framework | Hardhat |
| FHE Testing | `@fhevm/hardhat-plugin` + `@fhevm/mock-utils` |
| Encryption SDK | `@zama-fhe/relayer-sdk` |
| Solidity Version | 0.8.27 |

## License

BSD-3-Clause-Clear
