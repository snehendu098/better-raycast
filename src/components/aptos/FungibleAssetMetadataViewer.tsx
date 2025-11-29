import { Detail, ActionPanel, Action, Icon } from "@raycast/api";
import { FungibleAssetMetadata } from "../../actions/aptos/fetch-fungible-asset-metadata";
import { NetworkType } from "../../types";

interface FungibleAssetMetadataViewerProps {
  metadata: FungibleAssetMetadata;
  network: NetworkType;
  onBack: () => void;
}

export default function FungibleAssetMetadataViewer({
  metadata,
  network,
  onBack,
}: FungibleAssetMetadataViewerProps) {
  // Helper functions to format values
  const formatSupplyV2 = metadata.supplyV2 !== null ? `\`${metadata.supplyV2}\`` : "N/A";
  const formatMaximumV2 = metadata.maximumV2 !== null ? `\`${metadata.maximumV2}\`` : "N/A";
  const formatProjectUri = metadata.projectUri ? `[View Project](${metadata.projectUri})` : "N/A";
  const formatIconUri = metadata.iconUri ? `[View Icon](${metadata.iconUri})` : "N/A";
  const networkName = network === "mainnet" ? "Mainnet" : network === "testnet" ? "Testnet" : "Devnet";

  // Build markdown content with all asset metadata
  const markdown = `# Fungible Asset Metadata

## Basic Information

| Field | Value |
|-------|-------|
| **Name** | \`${metadata.name}\` |
| **Symbol** | \`${metadata.symbol}\` |
| **Asset Type** | \`${metadata.assetType}\` |
| **Token Standard** | \`${metadata.tokenStandard}\` |

## Supply Information

| Field | Value |
|-------|-------|
| **Decimals** | \`${metadata.decimals}\` |
| **Supply V2** | ${formatSupplyV2} |
| **Maximum V2** | ${formatMaximumV2} |

## Creator & Links

| Field | Value |
|-------|-------|
| **Creator Address** | \`${metadata.creatorAddress}\` |
| **Project URI** | ${formatProjectUri} |
| **Icon URI** | ${formatIconUri} |

---

Network: **${networkName}**
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Asset Type" content={metadata.assetType} />
          <Action.CopyToClipboard title="Copy Creator Address" content={metadata.creatorAddress} />
          <Action.CopyToClipboard title="Copy Name" content={metadata.name} />
          <Action.CopyToClipboard title="Copy Symbol" content={metadata.symbol} />
          {metadata.projectUri && (
            <Action.OpenInBrowser title="View Project" url={metadata.projectUri} />
          )}
          {metadata.iconUri && (
            <Action.OpenInBrowser title="View Icon" url={metadata.iconUri} />
          )}
          <Action title="Back" icon={Icon.ArrowLeft} onAction={onBack} />
        </ActionPanel>
      }
    />
  );
}
