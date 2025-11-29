import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { getExplorerUrl, formatAddress } from "../../utils/aptos";
import { NetworkType } from "../../types";
import { BALANCE_DISPLAY_DECIMALS } from "../../constants";

interface WalletInfoProps {
  address: string;
  balance: number | null;
  network: NetworkType;
  onRefreshBalance: () => Promise<void>;
}

export default function WalletInfo({ address, balance, network, onRefreshBalance }: WalletInfoProps) {
  return (
    <List.Section title="Your Wallet">
      <List.Item
        icon={Icon.Wallet}
        title="Address"
        subtitle={formatAddress(address)}
        accessories={[{ icon: Icon.CopyClipboard }]}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Full Address" content={address} />
            <Action.OpenInBrowser title="View on Explorer" url={getExplorerUrl("account", address, network)} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Coins}
        title="Balance"
        subtitle={balance !== null ? `${balance.toFixed(BALANCE_DISPLAY_DECIMALS)} APT` : "Loading..."}
        accessories={[{ icon: Icon.ArrowClockwise, tooltip: "Refresh" }]}
        actions={
          <ActionPanel>
            <Action title="Refresh Balance" icon={Icon.ArrowClockwise} onAction={onRefreshBalance} />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}
