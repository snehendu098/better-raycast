// Network types
export type NetworkType = "testnet" | "mainnet" | "devnet";

// Transaction types
export interface TransactionInfo {
  hash: string;
  success: boolean;
  type: string;
  timestamp: string;
  version: string;
  gasUsed: number;
}

// Balance types
export interface CoinBalance {
  coinType: string;
  amount: number;
}

// NFT types
export interface NFTInfo {
  name: string;
  collectionName: string;
  tokenUri: string;
}

// Account types
export interface AccountInfo {
  sequenceNumber: string;
  authenticationKey: string;
}

export interface StakingInfo {
  stakedAmount: number;
  pendingRewards: number;
}

// Signature types
export interface SignatureResult {
  signature: string;
  publicKey: string;
}

// Transfer types
export interface TransferResult {
  hash: string;
  success: boolean;
}

export interface SimulationResult {
  gasUsed: number;
  success: boolean;
}

// Wallet state types
export interface WalletState {
  privateKey: string | null;
  address: string | null;
  balance: number | null;
  network: NetworkType;
  isLoading: boolean;
}

// Component prop types
export interface NetworkProps {
  network: NetworkType;
}

export interface AddressProps extends NetworkProps {
  address: string;
}

export interface WalletProps extends AddressProps {
  privateKey: string;
}
