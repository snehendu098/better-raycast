import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import AeriesLendForm from "./AeriesLendForm";
import AeriesBorrowForm from "./AeriesBorrowForm";
import AeriesRepayForm from "./AeriesRepayForm";
import AeriesWithdrawForm from "./AeriesWithdrawForm";
import AeriesProfileForm from "./AeriesProfileForm";

interface AeriesOperationsProps {
  network: NetworkType;
  privateKey: string;
  address: string;
  onNetworkChange: (network: NetworkType) => Promise<void>;
  onOperationComplete?: () => void;
}

export default function AeriesOperations({
  network,
  privateKey,
  address,
  onNetworkChange,
  onOperationComplete,
}: AeriesOperationsProps) {
  // Check if user is on mainnet
  if (network !== "mainnet") {
    return (
      <List.Section title="⚠️ Aeries Operations">
        <List.Item
          icon={Icon.Warning}
          title="Mainnet Required"
          subtitle="Switch to Mainnet to use Aeries lending"
          accessories={[{ text: network === "testnet" ? "Testnet" : "Devnet" }]}
          actions={
            <ActionPanel>
              <Action title="Switch to Mainnet" icon={Icon.ArrowNe} onAction={() => onNetworkChange("mainnet")} />
            </ActionPanel>
          }
        />
      </List.Section>
    );
  }

  // Mainnet view - show Aeries operations
  return (
    <List.Section title="Aeries Lending & Borrowing">
      <List.Item
        icon={Icon.Person}
        title="Create Profile"
        subtitle="Create an Aeries profile"
        actions={
          <ActionPanel>
            <Action.Push
              title="Create Profile"
              icon={Icon.Person}
              target={
                <AeriesProfileForm
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
        icon={Icon.Upload}
        title="Lend (Supply)"
        subtitle="Supply tokens to Aeries"
        actions={
          <ActionPanel>
            <Action.Push
              title="Lend Tokens"
              icon={Icon.Upload}
              target={
                <AeriesLendForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Download}
        title="Borrow"
        subtitle="Borrow tokens from Aeries"
        actions={
          <ActionPanel>
            <Action.Push
              title="Borrow Tokens"
              icon={Icon.Download}
              target={
                <AeriesBorrowForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.ArrowDown}
        title="Repay"
        subtitle="Repay borrowed tokens to Aeries"
        actions={
          <ActionPanel>
            <Action.Push
              title="Repay Tokens"
              icon={Icon.ArrowDown}
              target={
                <AeriesRepayForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Download}
        title="Withdraw"
        subtitle="Withdraw supplied tokens from Aeries"
        actions={
          <ActionPanel>
            <Action.Push
              title="Withdraw Tokens"
              icon={Icon.Download}
              target={
                <AeriesWithdrawForm
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
