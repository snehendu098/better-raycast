# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Better** is a Raycast extension that provides a comprehensive interface for interacting with the Aptos blockchain. It enables users to manage wallets, perform transactions, stake tokens, swap tokens via Liquidswap DEX, lend/borrow assets via Aeries lending protocol, and query NFT/fungible asset data.

**Tech Stack:**
- Raycast API for CLI/command interface
- React (TSX) for UI components
- TypeScript for type safety
- Aptos JS Pro SDK (`@aptos-labs/js-pro`) for blockchain interactions
- Aptos TS SDK (`@aptos-labs/ts-sdk`) for core Aptos types and utilities

## Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build the extension
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

## Architecture & Code Organization

### Directory Structure

```
src/
├── better.tsx                 # Main entry point (Raycast command)
├── actions/                   # Pure functions that interact with Aptos blockchain
│   ├── aptos/                # Core Aptos operations (transfers, signing, balances)
│   ├── amnis/                # Amnis staking operations (stake/unstake)
│   ├── liquidswap/           # Liquidswap swap operations and token helpers
│   └── aeries/               # Aeries lending protocol operations (lend/borrow/repay/withdraw/create-profile)
├── components/               # React components for Raycast UI
│   ├── aptos/                # Wallet, transfer, NFT, and data lookup components
│   ├── amnis/                # Amnis staking UI components
│   ├── liquidswap/           # Liquidswap swap UI components
│   └── aeries/               # Aeries lending protocol UI components
├── hooks/                    # React hooks
│   └── useWallet.ts          # Main hook for wallet state management
├── utils/                    # Utility functions
│   ├── aptos.ts              # Aptos SDK client initialization and helpers
│   └── core.ts               # Core utility functions
├── constants/                # Application constants
└── types/                    # TypeScript type definitions
```

### Key Architecture Patterns

#### 1. **Action Functions Pattern**
- Location: `src/actions/`
- Purpose: Pure functions that handle blockchain interactions
- Key Principle: Actions are **network-specific** - they accept a `privateKeyHex` and `network` parameter
- Examples: `stakeTokens()`, `unstakeTokens()`, `swap()`, `fetchTokenData()`, `fetchFungibleAssetMetadata()`
- Error Handling: All actions wrap errors in `try-catch` and throw descriptive `Error` objects
- Amount Conversion: All amounts must be converted to smallest units (OCTAs/decimals) before sending to blockchain
  - Use `OCTAS_PER_APT` constant from `src/constants/index.ts` for APT amounts
  - Use token-specific decimals for other tokens (query via SDK or token helpers)

#### 2. **Component Structure Pattern**
- Location: `src/components/`
- Two-component pattern for features:
  1. **Form Component** (e.g., `AmnisStakeForm.tsx`): Handles user input, validation, and calls action functions
  2. **Viewer Component** (e.g., `AmnisOperations.tsx`): Displays results and navigates to form components
- Error Handling in Forms: Errors should NOT crash the extension
  - Always catch errors with try-catch
  - Show errors via `showToast()` with Toast.Style.Failure
  - Keep form visible after errors so users can retry
  - Log errors to console for debugging without breaking UI

#### 3. **Network Validation Pattern**
- **Mainnet-Only Operations**: Amnis staking and Liquidswap swap are mainnet-only
- Implementation: Container component checks network and shows warning if not mainnet
- Pattern (see `AmnisOperations.tsx`):
  ```tsx
  if (network !== "mainnet") {
    return <List.Section>Warning banner with switch action</List.Section>
  }
  // Otherwise show form...
  ```

#### 4. **Loading State Management**
- **Critical Issue**: Reset `isLoading` state BEFORE navigation
- Pattern:
  ```tsx
  try {
    // ... fetch data ...
    setIsLoading(false);  // BEFORE push()
    push(<NextComponent />);
  } catch (error) {
    setIsLoading(false);  // BEFORE showing error
    await showToast(...);
  }
  ```
- **Why**: Components unmount after navigation, so `finally` blocks don't update visible UI

#### 5. **Wallet State Management**
- Hook: `useWallet()` in `src/hooks/useWallet.ts`
- Manages: privateKey, address, balance, network, and user actions
- Storage: Uses Raycast's `LocalStorage` to persist privateKey
- Key Methods:
  - `refreshBalance()`: Fetches latest balance
  - `handleNetworkChange()`: Switches network and updates balance
  - `handleLogout()`: Removes wallet with confirmation dialog

### Client Initialization Pattern

**AptosJSProClient Setup** (`src/utils/aptos.ts`):

```typescript
// For read-only operations
const client = getClient(network); // Network type: "testnet" | "mainnet" | "devnet"

// For transaction signing/submission
const client = getClientWithAccount(network, account);
```

The client is configured with:
- Network info from Aptos TS SDK `Network` enum
- Account info (for signing operations)
- Signer (uses account's private key)

### Form Submission Flow

1. User fills form and submits
2. Validate inputs in form component
3. Call action function with parameters
4. Action function:
   - Validates parameters
   - Converts amounts to smallest units
   - Builds transaction using `client.buildTransaction()`
   - Signs and submits using `client.signAndSubmitTransaction()`
   - **Waits for confirmation** using `client.waitForTransaction()`
   - **Validates success** with `transaction.success` flag
5. On success: navigate to viewer component
6. On error: show toast, keep form visible for retry

### Transaction Confirmation Pattern

Critical for preventing false success reports:

```typescript
const transactionResponse = await client.signAndSubmitTransaction({ transaction });
const confirmedTransaction = await client.waitForTransaction({
  transactionHash: transactionResponse.hash,
});

if (!confirmedTransaction.success) {
  throw new Error(`Transaction failed: ${confirmedTransaction.vm_status}`);
}
```

## Key Implementation Details

### Amount Conversion

Different token types have different decimals:
- APT: 8 decimals → use `OCTAS_PER_APT` constant
- USDC/USDT: 6 decimals
- Custom tokens: check via API or token metadata

Conversion formula:
```typescript
const amountInSmallestUnit = BigInt(Math.floor(humanReadableAmount * Math.pow(10, decimals)));
```

### Mainnet-Only Features

The following operations ONLY work on mainnet:
1. **Amnis Staking** (`src/actions/amnis/`)
2. **Liquidswap Swap** (`src/actions/liquidswap/swap.ts`)
3. **Aeries Lending Protocol** (`src/actions/aeries/`)

Hardcoded in action functions: `getClientWithAccount(Network.MAINNET, account)` (or default mainnet parameter)

UI validates at component level before showing forms.

### Error Handling Best Practices

**DO:**
- Catch all async operations with try-catch
- Throw descriptive errors with context
- Show user-friendly messages via toast
- Log errors to console for debugging
- Keep UI functional after errors

**DON'T:**
- Let unhandled errors crash the extension
- Show raw error messages to users (truncate if needed)
- Use finally blocks for state reset that affects UI rendering
- Assume API responses are always complete

### Token Metadata

For Liquidswap and other token operations:
- Common tokens defined in `src/actions/liquidswap/tokens.ts`
- Each token includes: symbol, name, decimals, moveStructId
- Use `findTokenBySymbol()` or `findTokenByMoveStructId()` helpers
- MoveStructId format: `0x[address]::module::TokenName`

### Explorer Links

Generate explorer URLs for transactions and accounts:
```typescript
import { getExplorerUrl } from "../../utils/aptos";

const txUrl = getExplorerUrl("txn", hash, network);
const accountUrl = getExplorerUrl("account", address, network);
```

Supports: "txn" | "account" | "fungible_asset" types

### Aeries Lending Protocol

Aeries is a mainnet-only lending protocol that enables users to lend (supply) assets and borrow against them.

**Action Functions** (`src/actions/aeries/`):
- `createAriesProfile(privateKeyHex, network)` - Initialize a new Aeries user profile
  - Function: `controller::register_user`
  - Arguments: "Main Account"
- `lendAriesToken(privateKeyHex, assetType, amount, decimals, network)` - Lend (supply) tokens
  - Function: `controller::deposit`
  - Type Arguments: Asset MoveStructId (e.g., "0x1::aptos_coin::AptosCoin")
  - Arguments: `[amountInSmallestUnit, false]`
- `borrowAriesToken(privateKeyHex, assetType, amount, decimals, network)` - Borrow tokens
  - Function: `controller::withdraw`
  - Type Arguments: Asset MoveStructId
  - Arguments: `[amountInSmallestUnit, true]`
- `repayAriesToken(privateKeyHex, assetType, amount, decimals, network)` - Repay borrowed tokens
  - Function: `controller::repay`
  - Type Arguments: Asset MoveStructId
  - Arguments: `[amountInSmallestUnit]`
- `withdrawAriesToken(privateKeyHex, assetType, amount, decimals, network)` - Withdraw lent tokens
  - Function: `controller::withdraw`
  - Type Arguments: Asset MoveStructId
  - Arguments: `[amountInSmallestUnit, false]`

**Key Features**:
- All operations are mainnet-only (default network parameter is mainnet)
- Requires profile creation before lending/borrowing
- Amount conversion: Use token-specific decimals (default 8 for APT)
- Follows standard transaction confirmation pattern with `waitForTransaction()` and `success` flag validation
- Full error handling with descriptive error messages

**UI Components** (`src/components/aeries/`):
- `AeriesProfileForm.tsx` - Create Aeries profile
- `AeriesLendForm.tsx` - Supply tokens to Aeries
- `AeriesBorrowForm.tsx` - Borrow tokens from Aeries
- `AeriesRepayForm.tsx` - Repay borrowed tokens
- `AeriesWithdrawForm.tsx` - Withdraw supplied tokens
- `AeriesOperations.tsx` - Container component (network validation and navigation)

## Common Development Patterns

### Adding a New Feature

1. **Create action function** in `src/actions/[protocol]/[operation].ts`
   - Accept: privateKeyHex, operation params, network
   - Return: result hash or data
   - Throw errors with descriptive messages

2. **Create form component** in `src/components/[protocol]/[Operation]Form.tsx`
   - Accepts: privateKey, address, network, callbacks
   - Handles input validation
   - Calls action function on submit
   - Shows loading state during operation

3. **Create viewer component** in `src/components/[protocol]/[Operation]Viewer.tsx`
   - Displays results in markdown using `<Detail>` component
   - Provides copy and explorer link actions

4. **Create container component** in `src/components/[protocol]/[Protocol]Operations.tsx`
   - Checks network requirements (mainnet-only features)
   - Shows warning if network not supported
   - Uses `Action.Push` to navigate to form component

5. **Export from components index** (`src/components/index.ts`)

6. **Integrate into WalletActions** or main better.tsx

### Debugging Tips

- Check console output with `/dev` command
- Use `console.error()` in action functions for error logging
- Raycast shows errors in extension logs
- For blockchain errors: check transaction status on Aptos Explorer
- Validate hex formats and address checksums for Aptos addresses

## Raycast-Specific Patterns

### Navigation

```typescript
const { pop, push } = useNavigation();

// Navigate to new view
push(<FormComponent ... />);

// Go back
pop();
```

### User Feedback

```typescript
// Toast notifications
showToast({ style: Toast.Style.Success, title: "Success", message: "..." });

// Confirmation dialog
const confirmed = await confirmAlert({
  title: "Confirm Action",
  message: "...",
  primaryAction: { title: "Confirm", style: Alert.ActionStyle.Default },
});
```

### Storage

```typescript
import { LocalStorage } from "@raycast/api";

// Save
await LocalStorage.setItem("key", value);

// Read
const value = await LocalStorage.getItem("key");

// Remove
await LocalStorage.removeItem("key");
```

## Testing & Validation

Before submitting changes:
1. Run `npm run lint` and fix issues
2. Run `npm run dev` to test in development
3. Test on both testnet and mainnet (if applicable)
4. Verify error handling doesn't crash extension
5. Check loading states complete properly
6. Validate transaction confirmations on explorer

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Loading state stays visible | Reset `isLoading` BEFORE `push()`, not in finally |
| Amount conversion errors | Use decimals-aware conversion, check token decimals |
| "Cannot read properties of undefined" | Add null/undefined checks before accessing properties |
| Transactions show success but fail on chain | Always wait for confirmation and check `.success` flag |
| Extension crashes on error | Wrap all async in try-catch, show toast instead of throwing |
| Network validation not working | Ensure hardcoded `Network.MAINNET` in action functions for mainnet-only ops |

