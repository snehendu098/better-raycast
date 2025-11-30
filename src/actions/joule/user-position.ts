import { getClient } from "../../utils/aptos";
import type { NetworkType } from "../../types";

/**
 * Get details about a user's position
 * @param userAddress The address of the user
 * @param positionId The ID of the position to query
 * @param network Network to query (default: mainnet)
 * @returns Position details
 * @throws Error if fetching user position fails or parameters are invalid
 * @example
 * ```ts
 * const positionDetails = await getUserPosition("0x123...", "position-123", "mainnet");
 * ```
 */
export async function getUserPosition(
  userAddress: string,
  positionId: string,
  network: NetworkType = "mainnet",
): Promise<any> {
  try {
    // Validate inputs
    if (!userAddress) {
      throw new Error("User address must be provided");
    }

    if (!positionId) {
      throw new Error("Position ID must be provided");
    }

    const client = getClient(network);
    const { aptos } = client.getClients();

    const result = await aptos.view({
      payload: {
        function: "0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::user_position_details",
        functionArguments: [userAddress, positionId],
      },
    });

    if (!result) {
      throw new Error("Failed to fetch user position");
    }

    return result;
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get user position: ${message}`);
  }
}
