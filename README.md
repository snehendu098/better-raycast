# Better

A powerful Raycast extension for comprehensive interaction with the Aptos blockchain. Manage wallets, execute transactions, stake tokens, swap assets, lend/borrow through Aeries, and query on-chain data—all from your command line.

## Features

### Wallet Management
- Create and import wallets from private keys
- Switch between mainnet, testnet, and devnet
- View real-time wallet balance
- Secure private key storage using Raycast's LocalStorage

### Core Transactions
- Send APT and other tokens to any address
- Batch transfer functionality
- Monitor transaction status in real-time

### Token Operations
- **Amnis Staking** (Mainnet only)
  - Stake APT tokens to earn rewards
  - Unstake tokens anytime
  - View staking positions

- **Liquidswap DEX** (Mainnet only)
  - Swap tokens directly from your wallet
  - Access liquidity pools
  - Multiple trading pairs supported

- **Aeries Lending Protocol** (Mainnet only)
  - Create lending profiles
  - Lend (supply) tokens to earn yield
  - Borrow tokens against collateral
  - Repay loans and withdraw supplied assets

- **Joule Lending Protocol** (Mainnet only)
  - Lend (supply) tokens to positions
  - Borrow tokens against supplied collateral
  - Repay borrowed tokens
  - Withdraw supplied tokens
  - Claim pool rewards

### Data Queries
- Look up NFT information
- Query fungible asset (FA) metadata
- View token balances and details
- Explore transaction and account data

## Installation

### Prerequisites
- macOS or Windows
- [Raycast](https://www.raycast.com/) installed
- Node.js and npm

### Setup
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development:
   ```bash
   npm run dev
   ```
4. Build for distribution:
   ```bash
   npm run build
   ```

## Usage

Launch the extension with the `Better` command in Raycast. You'll be presented with options to:

1. **Create/Import Wallet** - Set up your Aptos wallet
2. **View Balance** - Check your current balance
3. **Send Transactions** - Transfer tokens to addresses
4. **Stake/Unstake** - Manage staking positions with Amnis
5. **Swap Tokens** - Trade on Liquidswap DEX
6. **Lend/Borrow** - Interact with Aeries or Joule lending protocols
7. **Claim Rewards** - Claim rewards from Joule pool
8. **Query Data** - Look up NFTs and asset information

## Supported Networks

- **Mainnet** - Full production network with all features
- **Testnet** - For testing and development (limited features)
- **Devnet** - For early-stage development and experimental features

## Architecture

The extension is built with:
- **Frontend**: React with Raycast API
- **Blockchain Interactions**: Aptos JS Pro SDK and Aptos TS SDK
- **Type Safety**: Full TypeScript support

For detailed architectural information, see [CLAUDE.md](./CLAUDE.md).

## Development

### Available Commands
```bash
npm run dev          # Start development mode with hot reload
npm run build        # Build the extension
npm run lint         # Check code quality
npm run fix-lint     # Automatically fix linting issues
npm run publish      # Publish to Raycast Store
```

### Project Structure
```
src/
├── better.tsx                 # Main entry point
├── actions/                   # Blockchain interaction logic
│   ├── aptos/                # Core operations
│   ├── amnis/                # Staking protocol
│   ├── liquidswap/           # DEX operations
│   ├── aeries/               # Aeries lending protocol
│   └── joule/                # Joule lending protocol
├── components/               # React UI components
│   ├── aptos/
│   ├── amnis/
│   ├── liquidswap/
│   ├── aeries/
│   └── joule/
├── hooks/                    # React hooks
├── utils/                    # Utility functions
├── constants/                # Application constants
└── types/                    # TypeScript definitions
```

## Security

- Private keys are stored securely using Raycast's encrypted LocalStorage
- All transactions require explicit user confirmation
- No private keys are transmitted to external servers
- Network requests use the official Aptos APIs

## Supported Protocols

- **Aptos Core** - Native blockchain transactions
- **Amnis** - Liquid staking protocol
- **Liquidswap** - Automated market maker (DEX)
- **Aeries** - Decentralized lending protocol
- **Joule** - Decentralized lending protocol with positions

## Troubleshooting

### Transaction Failed
- Check your wallet balance
- Verify the recipient address format
- Ensure you're on the correct network for the operation
- Check the Aptos Explorer for transaction details

### Insufficient Balance
- Switch to a different network to check balances
- Ensure you have enough APT for gas fees

### Network Connection Issues
- Verify your internet connection
- Try switching networks and switching back
- Check the Aptos network status

## Contributing

Contributions are welcome! Please ensure:
1. Code passes `npm run lint`
2. Changes follow the existing architecture patterns (see CLAUDE.md)
3. New features include proper error handling
4. UI updates are tested in Raycast development mode

## License

MIT - See LICENSE file for details

## Support

For issues and feature requests, please open an issue on the repository.

## Disclaimer

This extension interacts with blockchain networks. Always double-check transaction details before confirmation. The authors are not responsible for any losses resulting from user error or network issues.