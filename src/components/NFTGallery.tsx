import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCallback } from "react";
import { getOwnedNFTs } from "../utils/aptos";
import { useFetch } from "../hooks";
import { NetworkType, NFTInfo } from "../types";

interface NFTGalleryProps {
  address: string;
  network: NetworkType;
}

function truncateUri(uri: string, maxLength: number = 30): string {
  if (uri.length <= maxLength) return uri;
  return `${uri.slice(0, maxLength)}...`;
}

export default function NFTGallery({ address, network }: NFTGalleryProps) {
  const fetchNFTs = useCallback(() => getOwnedNFTs(address, network), [address, network]);

  const { data: nfts, isLoading } = useFetch<NFTInfo[]>(fetchNFTs, {
    onError: "Failed to load NFTs",
    deps: [address, network],
  });

  return (
    <List isLoading={isLoading} navigationTitle="NFT Gallery">
      {(!nfts || nfts.length === 0) && !isLoading ? (
        <List.EmptyView title="No NFTs" description="No NFTs found for this address" />
      ) : (
        nfts?.map((nft, index) => (
          <List.Item
            key={`${nft.collectionName}-${nft.name}-${index}`}
            icon={Icon.Image}
            title={nft.name}
            subtitle={nft.collectionName}
            accessories={[{ text: truncateUri(nft.tokenUri) }]}
            actions={
              <ActionPanel>
                {nft.tokenUri && <Action.OpenInBrowser title="Open Token URI" url={nft.tokenUri} />}
                <Action.CopyToClipboard title="Copy Token URI" content={nft.tokenUri} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
