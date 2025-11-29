import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import AmnisStakeForm from "./AmnisStakeForm";
import AmnisWithdrawForm from "./AmnisWithdrawForm";

interface AmnisOperationsProps {
  network: NetworkType;
  privateKey: string;
  address: string;
  onNetworkChange: (network: NetworkType) => Promise<void>;
  onOperationComplete?: () => void;
}

export default function AmnisOperations({
  network,
  privateKey,
  address,
  onNetworkChange,
  onOperationComplete,
}: AmnisOperationsProps) {
  // Check if user is on mainnet
  if (network !== "mainnet") {
    return (
      <List.Section title="⚠️ Amnis Operations">
        <List.Item
          icon={Icon.Warning}
          title="Mainnet Required"
          subtitle="Switch to Mainnet to use Amnis staking"
          accessories={[{ text: network === "testnet" ? "Testnet" : "Devnet" }]}
          actions={
            <ActionPanel>
              <Action
                title="Switch to Mainnet"
                icon={Icon.ArrowNe}
                onAction={() => onNetworkChange("mainnet")}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    );
  }

  // Mainnet view - show stake and withdraw options
  return (
    <List.Section title="Amnis Staking Operations">
      <List.Item
        icon={Icon.Star}
        title="Stake Tokens"
        subtitle="Stake APT on Amnis"
        actions={
          <ActionPanel>
            <Action.Push
              title="Stake Tokens"
              icon={Icon.Star}
              target={
                <AmnisStakeForm
                  privateKey={privateKey}
                  address={address}
                  onOperationComplete={onOperationComplete}
                />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.ArrowDown}
        title="Withdraw Tokens"
        subtitle="Withdraw staked APT from Amnis"
        actions={
          <ActionPanel>
            <Action.Push
              title="Withdraw Tokens"
              icon={Icon.ArrowDown}
              target={
                <AmnisWithdrawForm
                  privateKey={privateKey}
                  address={address}
                  onOperationComplete={onOperationComplete}
                />
              }
            />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}
