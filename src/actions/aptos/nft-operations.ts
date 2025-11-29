import { NFTInfo, NetworkType } from "../../types";
import { getClient } from "../../utils/aptos";

// Get NFTs owned by an account
export async function getOwnedNFTs(address: string, network: NetworkType): Promise<NFTInfo[]> {
  try {
    const client = getClient(network);
    const { tokens } = await client.fetchAccountTokens({ address });

    return tokens.map((token: any) => ({
      name: token.current_token_data?.token_name || "Unknown",
      collectionName: token.current_token_data?.current_collection?.collection_name || "Unknown",
      tokenUri: token.current_token_data?.token_uri || "",
    }));
  } catch (error) {
    return [];
  }
}
