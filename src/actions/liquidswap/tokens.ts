/**
 * Common tokens on Aptos for Liquidswap
 */

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  moveStructId: string;
  icon?: string;
}

// Common tokens on Aptos mainnet
export const COMMON_TOKENS: Token[] = [
  {
    symbol: "APT",
    name: "Aptos Coin",
    decimals: 8,
    moveStructId: "0x1::aptos_coin::AptosCoin",
  },
  {
    symbol: "USDT",
    name: "USD Tether",
    decimals: 6,
    moveStructId: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    moveStructId: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  },
];

/**
 * Find a token by symbol
 */
export function findTokenBySymbol(symbol: string): Token | undefined {
  return COMMON_TOKENS.find((token) => token.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Find a token by MoveStructId
 */
export function findTokenByMoveStructId(moveStructId: string): Token | undefined {
  return COMMON_TOKENS.find((token) => token.moveStructId === moveStructId);
}

/**
 * Get token decimals
 */
export function getTokenDecimals(moveStructId: string): number {
  const token = findTokenByMoveStructId(moveStructId);
  return token?.decimals ?? 8; // Default to 8 if not found
}

/**
 * Validate that a string is a valid Move struct ID format
 * Valid formats: 0x[address]::module::TokenName
 */
export function isValidMoveStructId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }
  // Check if it starts with 0x and contains at least two `::`
  const pattern = /^0x[a-fA-F0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
  return pattern.test(id);
}

/**
 * Get token info (name, decimals) from a move struct ID
 * Returns preset token info if found, otherwise returns generic info
 */
export function getTokenInfo(moveStructId: string): { name: string; decimals: number } {
  const token = findTokenByMoveStructId(moveStructId);
  if (token) {
    return { name: token.name, decimals: token.decimals };
  }
  // For custom tokens, extract the token name from the move struct ID
  // Format: 0xaddress::module::TokenName
  const parts = moveStructId.split("::");
  const tokenName = parts[parts.length - 1] || "Unknown Token";
  return { name: tokenName, decimals: 8 }; // Default to 8 decimals for custom tokens
}
