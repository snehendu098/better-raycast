import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import NetworkSwitcher from "./NetworkSwitcher";

interface WalletSettingsProps {
  network: NetworkType;
  onNetworkChange: (network: NetworkType) => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function WalletSettings({ network, onNetworkChange, onLogout }: WalletSettingsProps) {
  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <List.Section title="Settings">
      <List.Item
        icon={Icon.Globe}
        title="Switch Network"
        subtitle={`Currently: ${networkLabel}`}
        actions={
          <ActionPanel>
            <Action.Push
              title="Switch Network"
              icon={Icon.Globe}
              target={<NetworkSwitcher currentNetwork={network} onNetworkChange={onNetworkChange} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Logout}
        title="Logout"
        subtitle="Remove wallet from this device"
        actions={
          <ActionPanel>
            <Action title="Logout" icon={Icon.Logout} style={Action.Style.Destructive} onAction={onLogout} />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}
