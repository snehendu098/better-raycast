import { Detail, ActionPanel, Action, Icon, Clipboard } from "@raycast/api";
import { TokenData } from "../../actions/aptos/fetch-token-data";
import { getExplorerUrl } from "../../utils/aptos";
import { NetworkType } from "../../types";

interface TokenDataViewerProps {
  tokenData: TokenData;
  network: NetworkType;
  onBack: () => void;
}

/**
 * Format JSON for better readability
 */
function formatJSON(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Build CDN image URI markdown link
 */
function buildImageMarkdown(cdnImageUri: string | null): string {
  if (!cdnImageUri) {
    return "N/A";
  }
  return `[View Image](${cdnImageUri})`;
}

export default function TokenDataViewer({
  tokenData,
  network,
  onBack,
}: TokenDataViewerProps) {
  const explorerUrl = getExplorerUrl("account", tokenData.tokenId, network);

  // Build markdown content with all token data
  const markdown = `# Token Data

## Basic Information

| Field | Value |
|-------|-------|
| **Name** | \`${tokenData.name}\` |
| **Description** | ${tokenData.description || "N/A"} |
| **Token ID** | \`${tokenData.tokenId}\` |
| **Token Standard** | \`${tokenData.tokenStandard}\` |
| **Amount** | \`${tokenData.amount}\` |

## Collection Information

| Field | Value |
|-------|-------|
| **Collection** | \`${tokenData.collection}\` |
| **Collection ID** | \`${tokenData.collectionId}\` |
| **Creator** | \`${tokenData.creator}\` |

## Token Properties

| Field | Value |
|-------|-------|
| **Is Fungible V2** | \`${tokenData.isFungibleV2}\` |
| **Is Soulbound** | \`${tokenData.isSoulbound}\` |

## Media

| Field | Value |
|-------|-------|
| **Metadata URI** | \`${tokenData.metadataUri}\` |
| **CDN Image URI** | ${buildImageMarkdown(tokenData.cdnImageUri)} |

## Transaction Information

| Field | Value |
|-------|-------|
| **Last Transaction Version** | \`${tokenData.lastTransactionVersion}\` |
| **Last Transaction Timestamp** | \`${tokenData.lastTransactionTimestamp}\` |

## Created Activity

\`\`\`json
${formatJSON(tokenData.createdActivity)}
\`\`\`

## Acquired Activity

\`\`\`json
${formatJSON(tokenData.acquiredActivity)}
\`\`\`

## Collection Data

\`\`\`json
${formatJSON(tokenData.collectionData)}
\`\`\`

## Token Properties

\`\`\`json
${formatJSON(tokenData.tokenProperties)}
\`\`\`

---

[View on Explorer](${explorerUrl})
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Token ID" content={tokenData.tokenId} />
          <Action.CopyToClipboard title="Copy Collection ID" content={tokenData.collectionId} />
          <Action.CopyToClipboard title="Copy Creator" content={tokenData.creator} />
          <Action.CopyToClipboard title="Copy Metadata URI" content={tokenData.metadataUri} />
          <Action.OpenInBrowser title="View on Explorer" url={explorerUrl} />
          <Action title="Back" icon={Icon.ArrowLeft} onAction={onBack} />
        </ActionPanel>
      }
    />
  );
}
