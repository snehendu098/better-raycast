import { AccountTransaction, AptosJSProClient } from "@aptos-labs/js-pro";
import { TransactionInfo, CoinBalance, TransferResult, SimulationResult, NetworkType } from "../../types";
import { OCTAS_PER_APT, DEFAULT_TX_LIMIT } from "../../constants";
import { getClient, getClientWithAccount, getAccountFromPrivateKey } from "../../utils/aptos";

// Get APT balance for an address, returns balance in APT (not octas)
export async function getBalance(address: string, network: NetworkType): Promise<number> {
  try {
    console.log(network);
    const client = getClient(network);
    const balance = await client.fetchBalance({ address, asset: "0xa" });

    console.log(balance, address);
    return Number(balance) / OCTAS_PER_APT;
  } catch (error) {
    // Account might not exist yet (no balance)
    return 0;
  }
}

// Get all coin balances for an account (not just APT)
export async function getAllBalances(address: string, network: NetworkType): Promise<CoinBalance[]> {
  try {
    const client = getClient(network);
    const { balances } = await client.fetchAccountCoins({ address });

    console.log(balances[1].metadata);

    return balances.map((coin: any) => {
      const decimals = coin.metadata?.decimals ?? 8;
      return {
        symbol: coin.metadata?.symbol || "Unknown",
        name: coin.metadata?.name || "Unknown",
        amount: Number(coin.amount) / Math.pow(10, decimals),
        decimals,
        assetType: coin.assetType,
        assetTypeV2: coin.assetTypeV2,
        iconUri: coin.metadata?.iconUri,
        isFrozen: coin.isFrozen,
        isPrimary: coin.isPrimary,
      };
    });
  } catch (error) {
    return [];
  }
}

// Transfer APT from one account to another
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

// Transfer any coin type (not just APT)
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

// Build a transaction from a private key using jspro
export async function buildTransactionFromPrivateKey(
  privateKeyHex: string,
  recipientAddress: string,
  amountInAPT: number,
  network: NetworkType,
) {
  // Create account from private key using helper function
  const account = getAccountFromPrivateKey(privateKeyHex);

  // Get client with account and signer
  const client = getClientWithAccount(network, account);

  // Convert amount to octas
  const amountInOctas = BigInt(Math.floor(amountInAPT * OCTAS_PER_APT));

  // Build transaction using jspro
  const transaction = await client.buildTransaction({
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amountInOctas],
    },
  });

  return {
    account,
    client,
    transaction,
    amountInOctas,
  };
}

// Simulate a transaction before sending (estimate gas)
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

// Get recent transactions for an account
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

    return transactions.map((tx: AccountTransaction) => {
      // Get timestamp and success from fungibleAssetActivities if available, fallback to defaults
      const activity = tx.fungibleAssetActivities[0];
      const timestamp = activity?.transactionTimestamp
        ? new Date(parseInt(activity.transactionTimestamp) / 1000).toLocaleString()
        : "Unknown";
      const success = activity?.isTransactionSuccess ?? true;

      return {
        hash: tx.transactionVersion,
        success,
        type: tx.userTransaction?.entryFunction || "Unknown",
        timestamp,
        version: tx.transactionVersion,
        gasUsed: 0, // Not available in AccountTransaction type
      };
    });
  } catch (error) {
    return [];
  }
}
