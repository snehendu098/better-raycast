import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useCallback } from "react";
import { getTransactionHistory, formatAddress, getExplorerUrl } from "../utils/aptos";
import { useFetch } from "../hooks";
import { NetworkType, TransactionInfo } from "../types";

interface TransactionHistoryProps {
  address: string;
  network: NetworkType;
}

export default function TransactionHistory({ address, network }: TransactionHistoryProps) {
  const fetchTransactions = useCallback(() => getTransactionHistory(address, network), [address, network]);

  const { data: transactions, isLoading } = useFetch<TransactionInfo[]>(fetchTransactions, {
    onError: "Failed to load transactions",
    deps: [address, network],
  });

  return (
    <List isLoading={isLoading} navigationTitle="Transaction History">
      {(!transactions || transactions.length === 0) && !isLoading ? (
        <List.EmptyView title="No Transactions" description="No transaction history found for this address" />
      ) : (
        transactions?.map((tx) => (
          <List.Item
            key={tx.hash}
            icon={{
              source: tx.success ? Icon.CheckCircle : Icon.XMarkCircle,
              tintColor: tx.success ? Color.Green : Color.Red,
            }}
            title={formatAddress(tx.hash)}
            subtitle={tx.timestamp}
            accessories={[
              {
                tag: {
                  value: tx.success ? "Success" : "Failed",
                  color: tx.success ? Color.Green : Color.Red,
                },
              },
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open in Explorer" url={getExplorerUrl("txn", tx.hash, network)} />
                <Action.CopyToClipboard title="Copy Hash" content={tx.hash} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
