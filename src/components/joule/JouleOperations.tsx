import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import JouleLendForm from "./JouleLendForm";
import JouleBorrowForm from "./JouleBorrowForm";
import JouleRepayForm from "./JouleRepayForm";
import JouleWithdrawForm from "./JouleWithdrawForm";
import JouleClaimRewardForm from "./JouleClaimRewardForm";

interface JouleOperationsProps {
  network: NetworkType;
  privateKey: string;
  address: string;
  onNetworkChange: (network: NetworkType) => Promise<void>;
  onOperationComplete?: () => void;
}

export default function JouleOperations({
  network,
  privateKey,
  address,
  onNetworkChange,
  onOperationComplete,
}: JouleOperationsProps) {
  // Check if user is on mainnet
  if (network !== "mainnet") {
    return (
      <List.Section title="⚠️ Joule Operations">
        <List.Item
          icon={Icon.Warning}
          title="Mainnet Required"
          subtitle="Switch to Mainnet to use Joule lending"
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

  // Mainnet view - show Joule operations
  return (
    <List.Section title="Joule Lending & Borrowing">
      <List.Item
        icon={Icon.Upload}
        title="Lend"
        subtitle="Lend tokens to a Joule position"
        actions={
          <ActionPanel>
            <Action.Push
              title="Lend Tokens"
              icon={Icon.Upload}
              target={
                <JouleLendForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Download}
        title="Borrow"
        subtitle="Borrow tokens from a Joule position"
        actions={
          <ActionPanel>
            <Action.Push
              title="Borrow Tokens"
              icon={Icon.Download}
              target={
                <JouleBorrowForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.ArrowDown}
        title="Repay"
        subtitle="Repay borrowed tokens to a Joule position"
        actions={
          <ActionPanel>
            <Action.Push
              title="Repay Tokens"
              icon={Icon.ArrowDown}
              target={
                <JouleRepayForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Download}
        title="Withdraw"
        subtitle="Withdraw lent tokens from a Joule position"
        actions={
          <ActionPanel>
            <Action.Push
              title="Withdraw Tokens"
              icon={Icon.Download}
              target={
                <JouleWithdrawForm privateKey={privateKey} address={address} onOperationComplete={onOperationComplete} />
              }
            />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Gift}
        title="Claim Rewards"
        subtitle="Claim rewards from Joule pool"
        actions={
          <ActionPanel>
            <Action.Push
              title="Claim Rewards"
              icon={Icon.Gift}
              target={
                <JouleClaimRewardForm
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
