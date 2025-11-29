import {
  AptosJSProClient,
  convertAptosAccountToAccountInfo,
  convertAptosAccountToSigner,
} from "@aptos-labs/js-pro";
import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants, Network } from "@aptos-labs/ts-sdk";
import { LocalStorage } from "@raycast/api";
import {
  NetworkType,
  TransactionInfo,
  NFTInfo,
  AccountInfo,
  StakingInfo,
  SignatureResult,
  TransferResult,
  SimulationResult,
  CoinBalance,
} from "../types";
import {
  OCTAS_PER_APT,
  EXPLORER_BASE_URL,
  DEFAULT_NETWORK,
  DEFAULT_TX_LIMIT,
  ADDRESS_TRUNCATE_START,
  ADDRESS_TRUNCATE_END,
} from "../constants";

// Re-export NetworkType for backwards compatibility
export type { NetworkType } from "../types";

// ============ NETWORK HELPERS ============

/**
 * Convert our NetworkType to Aptos SDK Network enum
 */
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

/**
 * Get the currently selected network from LocalStorage
 */
export async function getSelectedNetwork(): Promise<NetworkType> {
  const network = await LocalStorage.getItem<string>("network");
  return (network as NetworkType) || DEFAULT_NETWORK;
}

/**
 * Set the selected network in LocalStorage
 */
export async function setSelectedNetwork(network: NetworkType): Promise<void> {
  await LocalStorage.setItem("network", network);
}

// ============ CLIENT HELPERS ============

/**
 * Get AptosJSProClient for the specified network (read-only operations)
 */
export function getClient(network: NetworkType): AptosJSProClient {
  const aptosNetwork = getAptosNetwork(network);
  return new AptosJSProClient({
    network: { network: aptosNetwork as Network.MAINNET | Network.TESTNET | Network.DEVNET },
  });
}

/**
 * Get AptosJSProClient with account and signer for transactions
 */
export function getClientWithAccount(network: NetworkType, account: Account): AptosJSProClient {
  const aptosNetwork = getAptosNetwork(network);
  return new AptosJSProClient({
    network: { network: aptosNetwork as Network.MAINNET | Network.TESTNET | Network.DEVNET },
    account: convertAptosAccountToAccountInfo(account),
    signer: convertAptosAccountToSigner(account),
  });
}

/**
 * Get Explorer URL for the specified network
 */
export function getExplorerUrl(type: "account" | "txn", hash: string, network: NetworkType): string {
  return `${EXPLORER_BASE_URL}/${type}/${hash}?network=${network}`;
}

// ============ ACCOUNT HELPERS ============

/**
 * Create an Account object from a private key string
 */
export function getAccountFromPrivateKey(privateKeyHex: string): Account {
  const privateKey = new Ed25519PrivateKey(PrivateKey.formatPrivateKey(privateKeyHex, PrivateKeyVariants.Ed25519));
  return Account.fromPrivateKey({ privateKey });
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string): string {
  const minLength = ADDRESS_TRUNCATE_START + ADDRESS_TRUNCATE_END + 3;
  if (address.length <= minLength) return address;
  return `${address.slice(0, ADDRESS_TRUNCATE_START)}...${address.slice(-ADDRESS_TRUNCATE_END)}`;
}

// ============ BALANCE OPERATIONS ============

/**
 * Get APT balance for an address
 * Returns balance in APT (not octas)
 */
export async function getBalance(address: string, network: NetworkType): Promise<number> {
  try {
    const client = getClient(network);
    const balance = await client.fetchAptBalance({ address });
    return Number(balance) / OCTAS_PER_APT;
  } catch (error) {
    // Account might not exist yet (no balance)
    return 0;
  }
}

/**
 * Get all coin balances for an account (not just APT)
 */
export async function getAllBalances(address: string, network: NetworkType): Promise<CoinBalance[]> {
  try {
    const client = getClient(network);
    const { balances } = await client.fetchAccountCoins({ address });

    return balances.map((coin: any) => ({
      coinType: coin.metadata?.symbol || coin.asset_type || "Unknown",
      amount: Number(coin.amount) / OCTAS_PER_APT,
      ...coin,
    }));
  } catch (error) {
    return [];
  }
}

// ============ TRANSACTION OPERATIONS ============

/**
 * Transfer APT from one account to another
 */
export async function transferAPT(
  senderPrivateKey: string,
  recipientAddress: string,
  amountInAPT: number,
  network: NetworkType,
): Promise<TransferResult> {
  const sender = getAccountFromPrivateKey(senderPrivateKey);
  const client = getClientWithAccount(network, sender);

  const amountInOctas = BigInt(Math.floor(amountInAPT * OCTAS_PER_APT));

  const pendingTx = await client.signAndSubmitTransaction({
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amountInOctas],
    },
  });

  const executedTx = await client.waitForTransaction({ hash: pendingTx.hash });

  return {
    hash: pendingTx.hash,
    success: executedTx.success,
  };
}

/**
 * Transfer any coin type (not just APT)
 */
export async function transferCoin(
  senderPrivateKey: string,
  recipientAddress: string,
  amountInOctas: bigint,
  coinType: string,
  network: NetworkType,
): Promise<TransferResult> {
  const sender = getAccountFromPrivateKey(senderPrivateKey);
  const client = getClientWithAccount(network, sender);

  const pendingTx = await client.signAndSubmitTransaction({
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [coinType],
      functionArguments: [recipientAddress, amountInOctas],
    },
  });

  const executedTx = await client.waitForTransaction({ hash: pendingTx.hash });

  return {
    hash: pendingTx.hash,
    success: executedTx.success,
  };
}

/**
 * Simulate a transaction before sending (estimate gas)
 */
export async function simulateTransfer(
  senderPrivateKey: string,
  recipientAddress: string,
  amountInAPT: number,
  network: NetworkType,
): Promise<SimulationResult> {
  const sender = getAccountFromPrivateKey(senderPrivateKey);
  const client = getClientWithAccount(network, sender);
  const amountInOctas = BigInt(Math.floor(amountInAPT * OCTAS_PER_APT));

  const transaction = await client.buildTransaction({
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amountInOctas],
    },
  });

  const simulation = await client.simulateTransaction({ transaction });

  return {
    gasUsed: Number(simulation.gas_used),
    success: simulation.success,
  };
}

// ============ TRANSACTION HISTORY ============

/**
 * Get recent transactions for an account
 */
export async function getTransactionHistory(
  address: string,
  network: NetworkType,
  limit: number = DEFAULT_TX_LIMIT,
): Promise<TransactionInfo[]> {
  try {
    const client = getClient(network);
    const { transactions } = await client.fetchAccountTransactions({
      address,
      limit,
    });

    return transactions.map((tx: any) => ({
      hash: tx.transaction_version?.toString() || tx.hash || "Unknown",
      success: tx.user_transaction?.success ?? true,
      type: tx.user_transaction?.payload?.type || "Unknown",
      timestamp: tx.user_transaction?.timestamp
        ? new Date(parseInt(tx.user_transaction.timestamp) / 1000).toLocaleString()
        : "Unknown",
      version: tx.transaction_version?.toString() || "Unknown",
      gasUsed: Number(tx.user_transaction?.gas_used) || 0,
    }));
  } catch (error) {
    return [];
  }
}

// ============ ACCOUNT OPERATIONS ============

/**
 * Get account info (sequence number, auth key)
 */
export async function getAccountInfo(address: string, network: NetworkType): Promise<AccountInfo | null> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    const info = await aptos.getAccountInfo({ accountAddress: address });

    return {
      sequenceNumber: info.sequence_number,
      authenticationKey: info.authentication_key,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if an account exists on chain
 */
export async function accountExists(address: string, network: NetworkType): Promise<boolean> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    await aptos.getAccountInfo({ accountAddress: address });
    return true;
  } catch (error) {
    return false;
  }
}

// ============ NFT OPERATIONS ============

/**
 * Get NFTs owned by an account
 */
export async function getOwnedNFTs(address: string, network: NetworkType): Promise<NFTInfo[]> {
  try {
    const client = getClient(network);
    const { tokens } = await client.fetchAccountTokens({ address });

    return tokens.map((token: any) => ({
      name: token.current_token_data?.token_name || "Unknown",
      collectionName: token.current_token_data?.current_collection?.collection_name || "Unknown",
      tokenUri: token.current_token_data?.token_uri || "",
    }));
  } catch (error) {
    return [];
  }
}

// ============ SIGNING OPERATIONS ============

/**
 * Sign an arbitrary message
 */
export function signMessage(privateKeyHex: string, message: string): SignatureResult {
  const account = getAccountFromPrivateKey(privateKeyHex);
  const messageBytes = new TextEncoder().encode(message);
  const signature = account.sign(messageBytes);

  return {
    signature: signature.toString(),
    publicKey: account.publicKey.toString(),
  };
}

// ============ ANS (APTOS NAME SERVICE) ============

/**
 * Get ANS name from address (e.g., "0x123..." -> "kent.apt")
 */
export async function getNameFromAddress(address: string, network: NetworkType): Promise<string | null> {
  try {
    const client = getClient(network);
    const name = await client.fetchNameFromAddress({ address });
    return name?.toString() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get address from ANS name (e.g., "kent.apt" -> "0x123...")
 */
export async function getAddressFromName(name: string, network: NetworkType): Promise<string | null> {
  try {
    const client = getClient(network);
    const address = await client.fetchAddressFromName({ name });
    return address?.toString() || null;
  } catch (error) {
    return null;
  }
}

// ============ STAKING OPERATIONS ============

/**
 * Get staking info for an account
 */
export async function getStakingInfo(address: string, network: NetworkType): Promise<StakingInfo | null> {
  try {
    const client = getClient(network);
    const { aptos } = client.getClients();
    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });

    const stakePool = resources.find((r: any) => r.type === "0x1::stake::StakePool");

    if (!stakePool) return null;

    return {
      stakedAmount: Number((stakePool.data as any)?.active?.value || 0) / OCTAS_PER_APT,
      pendingRewards: 0,
    };
  } catch (error) {
    return null;
  }
}
