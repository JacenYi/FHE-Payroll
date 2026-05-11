# FHE Payroll Dapp

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Frontend Framework | React | 19.2.5 |
| Build Tool | Vite | 8.0.10 |
| Styling Framework | TailwindCSS | 3.4.19 |
| Blockchain Interaction | ethers.js | 6.16.0 |
| FHE Encryption | @zama-fhe/react-sdk | 3.0.0 |
| Routing | react-router-dom | 7.15.0 |
| State Management | React Context | - |
| Data Caching | @tanstack/react-query | 5.100.9 |
| Icon Library | lucide-react | 1.14.0 |

---

## 📁 Directory Structure

```
src/
├── components/          # UI Components
│   ├── ui/             # Base UI Components
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── select.jsx
│   │   └── separator.jsx
│   ├── EmployeeManagement.jsx
│   ├── Navbar.jsx
│   └── WalletSection.jsx
├── config/             # Configuration
│   └── env.js
├── i18n/               # Internationalization
│   ├── locale/
│   │   ├── en.js
│   │   └── zh.js
│   └── i18n.jsx
├── lib/                # Utility Functions
│   └── utils.js
├── pages/              # Page Components
│   ├── HomePage.jsx
│   ├── WalletPage.jsx
│   ├── EmployeeManagementPage.jsx
│   ├── PayrollPage.jsx
│   └── EmployeeViewPage.jsx
├── store/              # State Management
│   ├── walletContext.js
│   └── walletStore.jsx
├── utils/              # Core Utilities
│   ├── evmContract.js
│   └── relayerSdk.jsx
├── App.jsx             # Main App Component
├── App.css             # App Styles
├── index.css           # Global Styles
└── main.jsx            # App Entry
```

---

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm or yarn
- MetaMask browser extension

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Copy and configure the `.env` file:

```env
# Contract Configuration
VITE_CONTRACT_ADDRESS=0xe7*************************0512
VITE_SALARY_TOKEN_ADDRESS=0x5F***************************80aa3

# Zama Relayer API Key (Optional)
VITE_ZAMA_RELAYER_API_KEY=your_api_key_here

# Testnet Configuration (Optional, use defaults if not set)
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_HOLESKY_RPC_URL=https://ethereum-holesky.publicnode.com
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📱 Page Functionality

### Page Permissions

| Path | Page Name | Admin | Employee | Public |
|------|-----------|-------|----------|--------|
| `/` | Home | ✅ | ✅ | ✅ |
| `/wallet` | Wallet | ✅ | ✅ | ✅ |
| `/employees` | Employee Management | ✅ | ❌ | ❌ |
| `/payroll` | Payroll Distribution | ✅ | ❌ | ❌ |
| `/view` | Payroll View | ❌ | ✅ | ❌ |

### Home Page (`/`)

**File**: `src/pages/HomePage.jsx`

**Features**:
- App introduction and feature showcase
- Wallet connection entry point
- Quick navigation buttons (different entry points based on role)
- Usage steps explanation

### Wallet Page (`/wallet`)

**File**: `src/pages/WalletPage.jsx`

**Features**:
- Display wallet connection status
- Show wallet address and balance
- Display current network information
- Connect/disconnect wallet operations

### Employee Management Page (`/employees`)

**File**: `src/pages/EmployeeManagementPage.jsx`

**Features**:
- Add new employee form
- Employee list display
- Employee details view

**Form Fields**:
| Field | Type | Description |
|-------|------|-------------|
| Wallet Address | String | Employee wallet address |
| First Name | String | First name |
| Last Name | String | Last name |
| Email | String | Email address |
| Residential Address | String | Home address |

### Payroll Distribution Page (`/payroll`)

**File**: `src/pages/PayrollPage.jsx`

**Features**:
- Select employees for payroll distribution
- Enter salary amounts
- Encrypt salaries using FHE
- Batch payroll distribution
- Display distribution progress

**Core Flow**:
```
Select Employee → Enter Salary → FHE Encrypt → Send to Chain → Record Payment
```

### Employee View Page (`/view`)

**File**: `src/pages/EmployeeViewPage.jsx`

**Features**:
- View personal payroll records
- Decrypt and view encrypted salaries
- Display payroll history

---

## 🔄 Core Business Flows

### Overall Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Administrator Flow                         │
├─────────────────────────────────────────────────────────────────┤
│  Connect Wallet → Add Employee → Select Employee → Enter Salary  │
│  → FHE Encrypt → Distribute Salary                              │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                       Employee Flow                           │
├───────────────────────────────────────────────────────────────┤
│           Connect Wallet → View Payroll Records → Decrypt     │
└───────────────────────────────────────────────────────────────┘
```

### Payroll Distribution Flow

```
1. Administrator visits /payroll page
2. Selects employees to distribute salaries
3. Enters salary amount for each employee
4. Clicks "Encrypt & Distribute" button
5. System encrypts salary amount using FHE
6. Calls contract sendEncryptedSalary method
7. After transaction confirmation, payroll records are stored on-chain
8. Employees can view and decrypt encrypted salaries on /view page
```

### FHE Encryption Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FHE Encryption Flow                          │
├─────────────────────────────────────────────────────────────────┤
│  Get Public Key → Encrypt Salary (euint64) → Generate Input     │
│  Proof → Send to Contract                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FHE Decryption Flow                          │
├─────────────────────────────────────────────────────────────────┤
│      Get Encrypted Salary → Decrypt with Private Key → Show     │
│      Plaintext Salary                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Network Configuration

### Supported Networks

| Network Name | Chain ID | RPC URL | Relayer URL |
|--------------|----------|---------|-------------|
| Sepolia | 11155111 |https://sepolia.infura.io/v3/YOUR_INFURA_KEY | https://relayer.sepolia.zama.ai |

> **Note**: MetaMask newer versions require RPC URLs to use HTTPS protocol. We recommend using testnets for local development.

### Network Switching

The app automatically detects the current network. If it doesn't match the target network, it will prompt the user to switch networks.

---

## 📦 Core Modules

### Provider Hierarchy

```
WalletProvider (Wallet State)
  └── FHEProvider (FHE Encryption)
        └── App (Routing Configuration)
```

### Wallet State Management

**File**: `src/store/walletStore.jsx`

Wallet state includes:
- `account`: Current connected wallet address
- `isConnecting`: Whether wallet is connecting
- `chainId`: Current chain ID
- `balance`: ETH balance
- `provider`: ethers Provider instance
- `signer`: ethers Signer instance
- `contract`: Contract instance

### Contract Interaction

**File**: `src/utils/evmContract.js`

Main Methods:
| Method | Function |
|--------|----------|
| `connectWallet()` | Connect MetaMask wallet |
| `disconnectWallet()` | Disconnect wallet |
| `call(methodName, ...args)` | Call contract read-only method |
| `send(methodName, ...args)` | Call contract write method |
| `addEmployee(data)` | Add employee |
| `sendEncryptedSalary()` | Send encrypted salary |
| `getAllEmployees()` | Get employee list |

---

## ⚠️ Notes

1. **MetaMask Installation**: MetaMask browser extension is required before use
2. **Network Selection**: Recommend using Sepolia or Holesky testnets, local network requires HTTPS configuration
3. **Test Tokens**: Testnet operations require test tokens, available from faucets
4. **FHE Initialization**: First-time use requires key pair generation, may take some time

---


**Documentation Version**: v1.0  
**Generated Date**: 2026-05-09  
**Project Name**: FHE Payroll Dapp
