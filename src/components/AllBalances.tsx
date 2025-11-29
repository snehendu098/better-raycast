import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCallback } from "react";
import { getAllBalances } from "../utils/aptos";
import { useFetch } from "../hooks";
import { NetworkType, CoinBalance } from "../types";
import { BALANCE_DECIMALS } from "../constants";

interface AllBalancesProps {
  address: string;
  network: NetworkType;
}

function formatCoinType(coinType: string): string {
  const parts = coinType.split("::");
  if (parts.length >= 3) {
    return parts[parts.length - 1];
  }
  return coinType.length > 30 ? `${coinType.slice(0, 30)}...` : coinType;
}

export default function AllBalances({ address, network }: AllBalancesProps) {
  const fetchBalances = useCallback(() => getAllBalances(address, network), [address, network]);

  const { data: balances, isLoading } = useFetch<CoinBalance[]>(fetchBalances, {
    onError: "Failed to load balances",
    deps: [address, network],
  });

  console.log(balances);

  return (
    <List isLoading={isLoading} navigationTitle="All Balances">
      {(!balances || balances.length === 0) && !isLoading ? (
        <List.EmptyView title="No Balances" description="No coin balances found for this address" />
      ) : (
        balances?.map((coin, index) => (
          <List.Item
            key={`${coin.coinType}-${index}`}
            icon={Icon.Coins}
            title={formatCoinType(coin.coinType)}
            subtitle={coin.coinType}
            accessories={[{ text: `${coin.amount.toFixed(BALANCE_DECIMALS)}` }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Coin Type" content={coin.coinType} />
                <Action.CopyToClipboard title="Copy Balance" content={coin.amount.toString()} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
