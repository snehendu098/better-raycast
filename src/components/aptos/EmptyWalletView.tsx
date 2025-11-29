import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import SetupWallet from "./SetupWallet";
import GenerateWallet from "./GenerateWallet";
import NetworkSwitcher from "./NetworkSwitcher";

interface EmptyWalletViewProps {
  network: NetworkType;
  onWalletSetup: (key: string) => Promise<void>;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function EmptyWalletView({
  network,
  onWalletSetup,
  onNetworkChange,
}: EmptyWalletViewProps) {
  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <List.EmptyView
      icon={Icon.Lock}
      title="Not Authenticated"
      description={`Network: ${networkLabel} | Set up your wallet to get started`}
      actions={
        <ActionPanel>
          <Action.Push
            title="Set Up Wallet"
            icon={Icon.Key}
            target={<SetupWallet onComplete={onWalletSetup} />}
          />
          <Action.Push
            title="Generate New Wallet"
            icon={Icon.Plus}
            target={<GenerateWallet onComplete={onWalletSetup} />}
          />
          <Action.Push
            title="Switch Network"
            icon={Icon.Globe}
            target={<NetworkSwitcher currentNetwork={network} onNetworkChange={onNetworkChange} />}
          />
        </ActionPanel>
      }
    />
  );
}
