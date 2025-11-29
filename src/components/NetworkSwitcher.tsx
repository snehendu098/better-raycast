import { ActionPanel, Action, List, Icon, Color, showToast, Toast, useNavigation } from "@raycast/api";
import { NetworkType, setSelectedNetwork } from "../utils/aptos";

interface NetworkSwitcherProps {
  currentNetwork: NetworkType;
  onNetworkChange: (network: NetworkType) => void;
}

export default function NetworkSwitcher({ currentNetwork, onNetworkChange }: NetworkSwitcherProps) {
  const { pop } = useNavigation();

  async function handleSelect(network: NetworkType) {
    await setSelectedNetwork(network);
    await showToast({
      style: Toast.Style.Success,
      title: `Switched to ${network === "mainnet" ? "Mainnet" : "Testnet"}`,
    });
    onNetworkChange(network);
    pop();
  }

  return (
    <List>
      <List.Section title="Select Network">
        <List.Item
          icon={{
            source: Icon.Circle,
            tintColor: Color.Green,
          }}
          title="Testnet"
          subtitle="For testing and development"
          accessories={[currentNetwork === "testnet" ? { icon: Icon.Checkmark, tooltip: "Currently selected" } : {}]}
          actions={
            <ActionPanel>
              <Action title="Select Testnet" icon={Icon.Check} onAction={() => handleSelect("testnet")} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{
            source: Icon.Circle,
            tintColor: Color.Red,
          }}
          title="Mainnet"
          subtitle="Real transactions with real APT"
          accessories={[currentNetwork === "mainnet" ? { icon: Icon.Checkmark, tooltip: "Currently selected" } : {}]}
          actions={
            <ActionPanel>
              <Action title="Select Mainnet" icon={Icon.Check} onAction={() => handleSelect("mainnet")} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="⚠️ Warning">
        <List.Item
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Yellow }}
          title="Mainnet uses real money!"
          subtitle="Only use Mainnet if you know what you're doing"
        />
      </List.Section>
    </List>
  );
}
