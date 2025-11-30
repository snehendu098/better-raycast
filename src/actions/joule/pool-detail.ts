/**
 * Get details about a specific pool from Joule's API
 * @param mint The Move struct ID of the token to get details for (e.g., "0x1::aptos_coin::AptosCoin")
 * @returns Pool details including APY, LTV, market size, and borrowed amount
 * @throws Error if fetching pool details fails or pool is not found
 * @example
 * ```ts
 * const poolDetails = await getPoolDetails("0x1::aptos_coin::AptosCoin"); // For APT pool
 * const otherPoolDetails = await getPoolDetails("0x...::other_coin::OtherCoin"); // For other token pool
 * ```
 */
export async function getPoolDetails(mint: string): Promise<any> {
  try {
    // Validate inputs
    if (!mint) {
      throw new Error("Token mint address must be provided");
    }

    const allPoolDetailsResponse = await fetch("https://price-api.joule.finance/api/market");

    if (!allPoolDetailsResponse.ok) {
      throw new Error(`Failed to fetch pool data: ${allPoolDetailsResponse.status} ${allPoolDetailsResponse.statusText}`);
    }

    const allPoolDetails = (await allPoolDetailsResponse.json()) as { data: any[] };

    if (!allPoolDetails.data || !Array.isArray(allPoolDetails.data)) {
      throw new Error("Invalid pool data format from API");
    }

    const poolDetail = allPoolDetails.data.find((pool: any) => pool.asset.type.includes(mint));

    if (!poolDetail) {
      throw new Error(`Pool not found for token: ${mint}`);
    }

    return {
      assetName: poolDetail.asset.assetName,
      tokenAddress: mint,
      ltv: poolDetail.ltv,
      decimals: poolDetail.asset.decimals,
      marketSize: Number(poolDetail.marketSize) / poolDetail.asset.decimals,
      totalBorrowed: Number(poolDetail.totalBorrowed) / poolDetail.asset.decimals,
      depositApy: poolDetail.depositApy,
      extraDepositApy: poolDetail.extraAPY.depositAPY,
      borrowApy: poolDetail.borrowApy,
      price: poolDetail.priceInfo.price,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get pool details: ${message}`);
  }
}
