# FHE Payroll Demo

A privacy-preserving payroll application built with Fully Homomorphic Encryption (FHE) technology, demonstrating secure salary calculations and transactions using Zama's TFHE library.

## Features

- **Privacy-Preserving Salary Calculations**: Perform payroll computations on encrypted data
- **Employee Management**: Securely manage employee records with encrypted salaries
- **FHE-Based Transactions**: Execute token swaps and salary payments using FHE
- **Multi-Language Support**: English and Chinese language options
- **Wallet Integration**: Connect to blockchain wallets for secure transactions

## Technology Stack

- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **Zama FHE React SDK** - Fully Homomorphic Encryption library
- **Ethers.js** - Ethereum blockchain interactions
- **TailwindCSS 3** - CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- A supported blockchain wallet (MetaMask, etc.)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fhePayrollDemoZama

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Development

```bash
# Start development server
npm run dev
```

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── ui/             # Reusable UI components
│   └── [feature]/      # Feature-specific components
├── pages/              # Page components
├── utils/              # Utility functions and contracts
├── store/              # State management
├── config/             # Configuration files
├── i18n/               # Internationalization
└── lib/                # Shared libraries
```

## Smart Contracts

The application interacts with several smart contracts:
- **SalaryToken**: ERC20 token for salary payments
- **FheSalarySystem**: FHE-based salary management system
- **SwapContract**: Token swap functionality

## Scripts

Located in `scripts/` directory:
- `1-authorize-operator.js` - Authorize FHE operators
- `2-mint-cusdo.js` - Mint encrypted USD tokens
- `3-mint-usdo.js` - Mint regular USD tokens
- `4-authorize-swap-contract.js` - Authorize swap contract
- `5-deposit-usdo-to-swap.js` - Deposit tokens to swap

## License

This project is for demonstration purposes only.

## Acknowledgments

- [Zama](https://www.zama.ai/) for FHE technology
- [Vite](https://vitejs.dev/) for build tooling
- [React](https://react.dev/) for UI framework
