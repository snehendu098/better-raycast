import { getClient } from "../../utils/aptos";
import { NetworkType } from "../../types";

/**
 * Fungible asset metadata structure returned from fetchFungibleAssetMetadata
 */
export interface FungibleAssetMetadata {
  assetType: string;
  creatorAddress: string;
  decimals: number;
  iconUri: string | null;
  maximumV2: number | null;
  name: string;
  projectUri: string | null;
  supplyV2: number | null;
  symbol: string;
  tokenStandard: string;
}

/**
 * Fetch fungible asset metadata by asset address or coin type
 * @param asset The asset address or coin type identifier (e.g., "0xa" or "0x1::aptos_coin::AptosCoin")
 * @param network The network to query (defaults to mainnet)
 * @returns Fungible asset metadata
 */
export async function fetchFungibleAssetMetadata(
  asset: string | undefined,
  network: NetworkType = "mainnet",
): Promise<FungibleAssetMetadata> {
  try {
    // Validate asset is provided
    if (!asset || typeof asset !== "string") {
      throw new Error("Asset address or coin type must be a valid string");
    }

    const trimmedAsset = asset.trim();

    // Validate asset is not empty
    if (trimmedAsset.length === 0) {
      throw new Error("Asset address or coin type cannot be empty");
    }

    // Validate that it's either an address (0x...) or a coin type (0x...::...)
    const isAddress = trimmedAsset.startsWith("0x");
    const isCoinType = trimmedAsset.includes("::");

    if (!isAddress && !isCoinType) {
      throw new Error("Asset must be either an address (0x...) or a coin type (0x...::...)");
    }

    const client = getClient(network);

    const metadata = await client.fetchFungibleAssetMetadata({
      asset: trimmedAsset,
    });

    // Validate that metadata was returned
    if (!metadata) {
      throw new Error("No metadata returned from API. Asset may not exist.");
    }

    // Validate required fields exist
    if (!metadata.assetType || !metadata.symbol || !metadata.name) {
      throw new Error("Invalid metadata received: missing required fields");
    }

    return metadata as FungibleAssetMetadata;
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error occurred";
    throw new Error(`Failed to fetch fungible asset metadata: ${errorMessage}`);
  }
}
