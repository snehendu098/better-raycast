import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { NetworkType } from "../../types";
import LiquidswapSwapForm from "./LiquidswapSwapForm";

interface LiquidswapOperationsProps {
  network: NetworkType;
  privateKey: string;
  address: string;
  onNetworkChange: (network: NetworkType) => Promise<void>;
  onOperationComplete?: () => void;
}

export default function LiquidswapOperations({
  network,
  privateKey,
  address,
  onNetworkChange,
  onOperationComplete,
}: LiquidswapOperationsProps) {
  // Check if user is on mainnet
  if (network !== "mainnet") {
    return (
      <List.Section title="⚠️ Liquidswap Operations">
        <List.Item
          icon={Icon.Warning}
          title="Mainnet Required"
          subtitle="Switch to Mainnet to use Liquidswap"
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

  // Mainnet view - show swap option
  return (
    <List.Section title="Liquidswap DEX Operations">
      <List.Item
        icon={Icon.ArrowRightCircle}
        title="Swap Tokens"
        subtitle="Swap tokens on Liquidswap"
        actions={
          <ActionPanel>
            <Action.Push
              title="Swap Tokens"
              icon={Icon.ArrowRightCircle}
              target={
                <LiquidswapSwapForm
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
