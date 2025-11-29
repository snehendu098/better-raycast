import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useCallback } from "react";
import {
  getBalance,
  getAccountInfo,
  getNameFromAddress,
  getStakingInfo,
  getAllBalances,
  getTransactionHistory,
  getExplorerUrl,
  formatAddress,
} from "../utils/aptos";
import { useFetch } from "../hooks";
import { NetworkType, CoinBalance, TransactionInfo } from "../types";
import { BALANCE_DECIMALS } from "../constants";

interface AccountDetailsProps {
  address: string;
  network: NetworkType;
}

interface AccountData {
  balance: number;
  sequenceNumber: string | null;
  authenticationKey: string | null;
  ansName: string | null;
  stakedAmount: number | null;
  pendingRewards: number | null;
  allBalances: CoinBalance[];
  transactions: TransactionInfo[];
}

const APT_ASSET_TYPE = "0x1::aptos_coin::AptosCoin";

function getAssetExplorerUrl(coin: CoinBalance, network: NetworkType): string {
  if (coin.assetType === APT_ASSET_TYPE) {
    return getExplorerUrl("account", "0x1", network);
  }
  if (coin.assetTypeV2) {
    return getExplorerUrl("fungible_asset", coin.assetTypeV2, network);
  }
  return getExplorerUrl("account", coin.assetType, network);
}

function formatBalance(amount: number, decimals: number = BALANCE_DECIMALS): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.min(decimals, 6),
  });
}

export default function AccountDetails({ address, network }: AccountDetailsProps) {
  const fetchAccountData = useCallback(async (): Promise<AccountData> => {
    const [balance, accountInfo, ansName, stakingInfo, allBalances, transactions] = await Promise.all([
      getBalance(address, network),
      getAccountInfo(address, network),
      getNameFromAddress(address, network),
      getStakingInfo(address, network),
      getAllBalances(address, network),
      getTransactionHistory(address, network, 10),
    ]);

    return {
      balance,
      sequenceNumber: accountInfo?.sequenceNumber ?? null,
      authenticationKey: accountInfo?.authenticationKey ?? null,
      ansName,
      stakedAmount: stakingInfo?.stakedAmount ?? null,
      pendingRewards: stakingInfo?.pendingRewards ?? null,
      allBalances,
      transactions,
    };
  }, [address, network]);

  const { data, isLoading, refetch } = useFetch<AccountData>(fetchAccountData, {
    onError: "Failed to load account details",
    deps: [address, network],
  });

  return (
    <List isLoading={isLoading} navigationTitle="Portfolio" searchBarPlaceholder="Search tokens or transactions...">
      {/* Account Overview Section */}
      <List.Section title="Account Overview">
        <List.Item
          icon={{ source: Icon.Wallet, tintColor: Color.Blue }}
          title={data?.ansName || formatAddress(address)}
          subtitle={data?.ansName ? address : undefined}
          accessories={[
            { tag: { value: network.toUpperCase(), color: Color.Purple } },
            { icon: Icon.Globe },
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="View on Explorer" url={getExplorerUrl("account", address, network)} />
              <Action.CopyToClipboard title="Copy Address" content={address} />
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.Coins, tintColor: Color.Green }}
          title="APT Balance"
          accessories={[{ text: { value: `${formatBalance(data?.balance ?? 0)} APT`, color: Color.PrimaryText } }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Balance" content={data?.balance?.toString() || "0"} />
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.Lock, tintColor: data?.stakedAmount ? Color.Orange : Color.SecondaryText }}
          title="Staked Amount"
          accessories={[
            {
              text: {
                value: data?.stakedAmount ? `${formatBalance(data.stakedAmount)} APT` : "None",
                color: data?.stakedAmount ? Color.PrimaryText : Color.SecondaryText,
              },
            },
          ]}
          actions={
            <ActionPanel>
              {data?.stakedAmount && (
                <Action.CopyToClipboard title="Copy Staked Amount" content={data.stakedAmount.toString()} />
              )}
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Token Balances Section */}
      <List.Section title={`Tokens${data?.allBalances ? ` (${data.allBalances.length})` : ""}`}>
        {data?.allBalances && data.allBalances.length > 0 ? (
          data.allBalances.map((coin, index) => (
            <List.Item
              key={`${coin.assetType}-${index}`}
              icon={coin.iconUri ? { source: coin.iconUri } : { source: Icon.Coins, tintColor: Color.Yellow }}
              title={coin.symbol}
              subtitle={coin.name}
              accessories={[
                ...(coin.isFrozen ? [{ tag: { value: "Frozen", color: Color.Red } }] : []),
                { text: formatBalance(coin.amount, coin.decimals) },
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser title="View in Explorer" url={getAssetExplorerUrl(coin, network)} />
                  <Action.CopyToClipboard title="Copy Balance" content={coin.amount.toString()} />
                  <Action.CopyToClipboard title="Copy Asset Type" content={coin.assetType} />
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.Item
            icon={{ source: Icon.XMarkCircle, tintColor: Color.SecondaryText }}
            title="No Tokens"
            subtitle="No token balances found"
          />
        )}
      </List.Section>

      {/* Transaction History Section */}
      <List.Section title={`Recent Transactions${data?.transactions ? ` (${data.transactions.length})` : ""}`}>
        {data?.transactions && data.transactions.length > 0 ? (
          data.transactions.map((tx) => (
            <List.Item
              key={tx.version}
              icon={{
                source: tx.success ? Icon.CheckCircle : Icon.XMarkCircle,
                tintColor: tx.success ? Color.Green : Color.Red,
              }}
              title={tx.type !== "Unknown" ? tx.type.split("::").pop() || tx.type : `Transaction`}
              subtitle={`v${tx.version}`}
              accessories={[
                { date: new Date(tx.timestamp), tooltip: tx.timestamp },
                { tag: { value: tx.success ? "Success" : "Failed", color: tx.success ? Color.Green : Color.Red } },
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser title="View in Explorer" url={getExplorerUrl("txn", tx.version, network)} />
                  <Action.CopyToClipboard title="Copy Version" content={tx.version} />
                  <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={refetch} />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.Item
            icon={{ source: Icon.Clock, tintColor: Color.SecondaryText }}
            title="No Transactions"
            subtitle="No transaction history found"
          />
        )}
      </List.Section>
    </List>
  );
}
