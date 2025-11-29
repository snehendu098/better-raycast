import { AptosJSProClient } from "@aptos-labs/js-pro";
import { getClient } from "../../utils/aptos";
import { NetworkType } from "../../types";

/**
 * Token data structure returned from fetchTokenData
 */
export interface TokenData {
  amount: number;
  cdnImageUri: string | null;
  collection: string;
  collectionData: CollectionData;
  collectionId: string;
  creator: string;
  description: string;
  isFungibleV2: boolean;
  isSoulbound: boolean;
  lastTransactionTimestamp: string;
  lastTransactionVersion: string;
  metadataUri: string;
  name: string;
  tokenId: string;
  tokenProperties: Record<string, any>;
  tokenStandard: string;
  acquiredActivity: BaseTokenActivity;
  createdActivity: BaseTokenActivity;
}

/**
 * Collection data structure
 */
export interface CollectionData {
  [key: string]: any;
}

/**
 * Base token activity structure
 */
export interface BaseTokenActivity {
  [key: string]: any;
}

/**
 * Fetch token data for a given token address
 * @param tokenAddress The token address (NFT) to fetch data for
 * @param network The network to query (defaults to mainnet)
 * @returns Token data containing all details about the NFT
 */
export async function fetchTokenData(
  tokenAddress: string,
  network: NetworkType = "mainnet",
): Promise<TokenData> {
  try {
    // Validate token address format
    if (!tokenAddress || !tokenAddress.startsWith("0x")) {
      throw new Error("Invalid token address. Address must start with '0x'");
    }

    const client = getClient(network);

    const tokenData = await client.fetchTokenData({
      address: tokenAddress,
    });

    return tokenData as TokenData;
  } catch (error: any) {
    throw new Error(`Failed to fetch token data: ${error.message}`);
  }
}
