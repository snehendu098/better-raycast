import {
  AptosJSProClient,
  convertAptosAccountToAccountInfo,
  convertAptosAccountToSigner,
} from "@aptos-labs/js-pro";
import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants, Network } from "@aptos-labs/ts-sdk";
import { LocalStorage } from "@raycast/api";
import { NetworkType } from "../types";
import {
  EXPLORER_BASE_URL,
  DEFAULT_NETWORK,
  ADDRESS_TRUNCATE_START,
  ADDRESS_TRUNCATE_END,
} from "../constants";

// Re-export NetworkType for backwards compatibility
export type { NetworkType } from "../types";

// ============ NETWORK HELPERS ============

// Convert our NetworkType to Aptos SDK Network enum
function getAptosNetwork(network: NetworkType): Network {
  switch (network) {
    case "mainnet":
      return Network.MAINNET;
    case "devnet":
      return Network.DEVNET;
    case "testnet":
    default:
      return Network.TESTNET;
  }
}

// Get the currently selected network from LocalStorage
export async function getSelectedNetwork(): Promise<NetworkType> {
  const network = await LocalStorage.getItem<string>("network");
  return (network as NetworkType) || DEFAULT_NETWORK;
}

// Set the selected network in LocalStorage
export async function setSelectedNetwork(network: NetworkType): Promise<void> {
  await LocalStorage.setItem("network", network);
}

// ============ CLIENT HELPERS ============

// Get AptosJSProClient for the specified network (read-only operations)
export function getClient(network: NetworkType): AptosJSProClient {
  const aptosNetwork = getAptosNetwork(network);
  return new AptosJSProClient({
    network: { network: aptosNetwork as Network.MAINNET | Network.TESTNET | Network.DEVNET },
  });
}

// Get AptosJSProClient with account and signer for transactions
export function getClientWithAccount(network: NetworkType, account: Account): AptosJSProClient {
  const aptosNetwork = getAptosNetwork(network);
  return new AptosJSProClient({
    network: { network: aptosNetwork as Network.MAINNET | Network.TESTNET | Network.DEVNET },
    account: convertAptosAccountToAccountInfo(account),
    signer: convertAptosAccountToSigner(account),
  });
}

// Get Explorer URL for the specified network
export function getExplorerUrl(type: "account" | "txn" | "fungible_asset", hash: string, network: NetworkType): string {
  return `${EXPLORER_BASE_URL}/${type}/${hash}?network=${network}`;
}

// ============ ACCOUNT HELPERS ============

// Create an Account object from a private key string
export function getAccountFromPrivateKey(privateKeyHex: string): Account {
  const privateKey = new Ed25519PrivateKey(PrivateKey.formatPrivateKey(privateKeyHex, PrivateKeyVariants.Ed25519));
  return Account.fromPrivateKey({ privateKey });
}

// Format address for display (truncate middle)
export function formatAddress(address: string): string {
  const minLength = ADDRESS_TRUNCATE_START + ADDRESS_TRUNCATE_END + 3;
  if (address.length <= minLength) return address;
  return `${address.slice(0, ADDRESS_TRUNCATE_START)}...${address.slice(-ADDRESS_TRUNCATE_END)}`;
}

