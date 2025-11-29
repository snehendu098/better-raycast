import { List, ActionPanel, Action, Icon, Color } from "@raycast/api";
import { NetworkType } from "../../types";
import NetworkSwitcher from "./NetworkSwitcher";

interface NetworkBannerProps {
  network: NetworkType;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function NetworkBanner({ network, onNetworkChange }: NetworkBannerProps) {
  const networkIcon =
    network === "mainnet"
      ? { source: Icon.Circle, tintColor: Color.Red }
      : { source: Icon.Circle, tintColor: Color.Green };

  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <List.Section title={`Network: ${networkLabel}`}>
      <List.Item
        icon={networkIcon}
        title={network === "mainnet" ? "Mainnet" : "Testnet"}
        subtitle={network === "mainnet" ? "Real transactions with real APT" : "Test network for development"}
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
    </List.Section>
  );
}
