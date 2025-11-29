const PANORASWAP_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/refs/heads/main/token-list.json";

/**
 * Token details from Panoraswap token list
 */
export interface TokenDetail {
  name: string;
  symbol: string;
  decimals: number;
  tokenAddress?: string;
  faAddress?: string;
  logoUrl?: string;
  websiteUrl?: string;
  coinGeckoId?: string;
}

// Cache for token metadata to avoid repeated API calls
let tokenListCache: TokenDetail[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch the token list from Panoraswap
 * Uses in-memory caching to avoid excessive API calls
 */
async function fetchTokenList(): Promise<TokenDetail[]> {
  // Return cached data if still valid
  if (tokenListCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return tokenListCache;
  }

  try {
    const response = await fetch(PANORASWAP_TOKEN_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tokens = (await response.json()) as any[];

    // Transform to our TokenDetail format
    tokenListCache = tokens.map((token) => ({
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      tokenAddress: token.tokenAddress,
      faAddress: token.faAddress,
      logoUrl: token.logoUrl,
      websiteUrl: token.websiteUrl,
      coinGeckoId: token.coinGeckoId,
    }));

    cacheTimestamp = Date.now();
    return tokenListCache;
  } catch (error: any) {
    console.error("Failed to fetch token list from Panoraswap:", error.message);
    return [];
  }
}

/**
 * Find a token by address (either tokenAddress or faAddress)
 */
export async function getTokenByAddress(address: string): Promise<TokenDetail | undefined> {
  const tokens = await fetchTokenList();
  return tokens.find(
    (token) =>
      token.tokenAddress?.toLowerCase() === address.toLowerCase() ||
      token.faAddress?.toLowerCase() === address.toLowerCase(),
  );
}

/**
 * Find a token by symbol
 */
export async function getTokenBySymbol(symbol: string): Promise<TokenDetail | undefined> {
  const tokens = await fetchTokenList();
  return tokens.find((token) => token.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Get logo URL for a token by address
 * Returns the logoUrl from Panoraswap or null if not found
 */
export async function getTokenLogoUrl(address: string): Promise<string | null> {
  try {
    const token = await getTokenByAddress(address);
    return token?.logoUrl || null;
  } catch (error) {
    return null;
  }
}
