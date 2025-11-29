import { ActionPanel, Action, Form, useNavigation, showToast, Toast, Icon } from "@raycast/api";
import { useState } from "react";
import { fetchFungibleAssetMetadata } from "../../actions/aptos/fetch-fungible-asset-metadata";
import { NetworkType } from "../../types";
import FungibleAssetMetadataViewer from "./FungibleAssetMetadataViewer";

interface FungibleAssetMetadataLookupProps {
  network: NetworkType;
  onNetworkChange: (network: NetworkType) => Promise<void>;
}

export default function FungibleAssetMetadataLookup({ network, onNetworkChange }: FungibleAssetMetadataLookupProps) {
  const { pop, push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNetwork, setSelectedNetworkState] = useState<NetworkType>(network);

  async function handleNetworkChange(newNetwork: NetworkType) {
    setSelectedNetworkState(newNetwork);
    await onNetworkChange(newNetwork);
  }

  async function handleSubmit(values: { assetAddress: string }) {
    const { assetAddress } = values;

    if (!assetAddress || !assetAddress.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Address",
        message: "Please enter a valid asset address or coin type",
      });
      return;
    }

    const trimmedAsset = assetAddress.trim();

    // Validate format
    const isAddress = trimmedAsset.startsWith("0x");

    if (!isAddress) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Format",
        message: "Enter an address (0x...) or coin type (0x...::...)",
      });
      return;
    }

    setIsLoading(true);

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Fetching asset metadata...",
      });

      const metadata = await fetchFungibleAssetMetadata(trimmedAsset, selectedNetwork);

      // Validate that we got proper metadata
      if (!metadata || !metadata.assetType) {
        throw new Error("Invalid asset metadata received from API");
      }

      // Reset loading state BEFORE navigating
      setIsLoading(false);

      push(<FungibleAssetMetadataViewer metadata={metadata} network={selectedNetwork} onBack={() => pop()} />);

      await showToast({
        style: Toast.Style.Success,
        title: "Asset Metadata fetched",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      console.error("Asset metadata fetch error:", error);

      // Reset loading state on error
      setIsLoading(false);

      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Fetch Asset Metadata",
        message: message.length > 100 ? message.substring(0, 100) + "..." : message,
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Fetch Asset Metadata" icon={Icon.Magnifyinglass} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Fungible Asset Metadata Lookup"
        text="Enter an asset address or coin type to view its metadata"
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
        id="assetAddress"
        title="Asset Address or Coin Type"
        placeholder="0x... or 0x...::..."
        info="Enter the asset address (e.g., 0xa) or full coin type (e.g., 0x1::aptos_coin::AptosCoin)"
      />
    </Form>
  );
}
