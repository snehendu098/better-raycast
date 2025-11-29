import {
  ActionPanel,
  Action,
  Form,
  useNavigation,
  showToast,
  Toast,
  Icon,
} from "@raycast/api";
import { useState } from "react";
import { fetchTokenData } from "../../actions/aptos/fetch-token-data";
import { NetworkType } from "../../types";
import TokenDataViewer from "./TokenDataViewer";

interface TokenDataLookupProps {
  network: NetworkType;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function TokenDataLookup({
  network,
  onNetworkChange,
}: TokenDataLookupProps) {
  const { pop, push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNetwork, setSelectedNetworkState] = useState<NetworkType>(network);

  async function handleNetworkChange(newNetwork: NetworkType) {
    setSelectedNetworkState(newNetwork);
    await onNetworkChange(newNetwork);
  }

  async function handleSubmit(values: { tokenAddress: string }) {
    const { tokenAddress } = values;

    if (!tokenAddress || !tokenAddress.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Address",
        message: "Please enter a valid token address",
      });
      return;
    }

    const trimmedAddress = tokenAddress.trim();
    if (!trimmedAddress.startsWith("0x")) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Address Format",
        message: "Address must start with '0x'",
      });
      return;
    }

    setIsLoading(true);

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Fetching token data...",
      });

      const tokenData = await fetchTokenData(trimmedAddress, selectedNetwork);

      // Validate that we got proper token data
      if (!tokenData || !tokenData.tokenId) {
        throw new Error("Invalid token data received from API");
      }

      push(
        <TokenDataViewer
          tokenData={tokenData}
          network={selectedNetwork}
          onBack={() => pop()}
        />,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Show detailed error message but keep the form
      console.error("Token data fetch error:", error);

      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Fetch Token Data",
        message: message.length > 100 ? message.substring(0, 100) + "..." : message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Fetch Token Data"
            icon={Icon.Magnifyinglass}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Token Data Lookup"
        text="Enter an NFT address to view its complete data"
      />
      <Form.Dropdown
        id="network"
        title="Network"
        value={selectedNetwork}
        onChange={(value) => handleNetworkChange(value as NetworkType)}
      >
        <Form.Dropdown.Item value="testnet" title="Testnet" />
        <Form.Dropdown.Item value="mainnet" title="Mainnet" />
        <Form.Dropdown.Item value="devnet" title="Devnet" />
      </Form.Dropdown>
      <Form.TextField
        id="tokenAddress"
        title="Token Address"
        placeholder="0x..."
        info="Enter the NFT token address to look up"
      />
    </Form>
  );
}
