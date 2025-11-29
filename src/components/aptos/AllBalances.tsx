import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { useCallback } from "react";
import { getAllBalances } from "../../actions/aptos";
import { getExplorerUrl } from "../../utils/aptos";
import { useFetch } from "../../hooks";
import { NetworkType, CoinBalance } from "../../types";

interface AllBalancesProps {
  address: string;
  network: NetworkType;
}

const APT_ASSET_TYPE = "0x1::aptos_coin::AptosCoin";

function getAssetExplorerUrl(coin: CoinBalance, network: NetworkType): string {
  // APT coin uses account explorer type
  if (coin.assetType === APT_ASSET_TYPE) {
    return getExplorerUrl("account", "0x1", network);
  }
  // Other fungible assets use fungible_asset type with assetTypeV2 address
  if (coin.assetTypeV2) {
    return getExplorerUrl("fungible_asset", coin.assetTypeV2, network);
  }
  // Fallback to account view with assetType
  return getExplorerUrl("account", coin.assetType, network);
}

export default function AllBalances({ address, network }: AllBalancesProps) {
  const fetchBalances = useCallback(() => getAllBalances(address, network), [address, network]);

  const { data: balances, isLoading } = useFetch<CoinBalance[]>(fetchBalances, {
    onError: "Failed to load balances",
    deps: [address, network],
  });

  return (
    <List isLoading={isLoading} navigationTitle="All Balances">
      {(!balances || balances.length === 0) && !isLoading ? (
        <List.EmptyView title="No Balances" description="No coin balances found for this address" />
      ) : (
        balances?.map((coin, index) => (
          <List.Item
            key={`${coin.assetType}-${index}`}
            icon={coin.iconUri ? { source: coin.iconUri } : Icon.Coins}
            title={coin.symbol}
            subtitle={coin.name}
            accessories={[
              ...(coin.isFrozen
                ? [{ tag: { value: "Frozen", color: Color.Red } }]
                : []),
              ...(coin.isPrimary
                ? [{ tag: { value: "Primary", color: Color.Blue } }]
                : []),
              { text: `${coin.amount.toFixed(Math.min(coin.decimals, 8))}` },
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="View in Explorer" url={getAssetExplorerUrl(coin, network)} />
                <Action.CopyToClipboard title="Copy Asset Type" content={coin.assetType} />
                <Action.CopyToClipboard title="Copy Balance" content={coin.amount.toString()} />
                <Action.CopyToClipboard title="Copy Symbol" content={coin.symbol} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
