export interface TokenConfig {
    symbol: string;
    name: string;
    icon: string;
    enabled: boolean;
    decimals: number;
    // Contract addresses per chain will be in chains.ts
  }
  
  export const SUPPORTED_TOKENS: { [key: string]: TokenConfig } = {
    usdc: {
      symbol: "USDC",
      name: "USD Coin",
      icon: "/token/usdc.png",
      enabled: true,
      decimals: 6,
    },
    usdt: {
      symbol: "USDT", 
      name: "Tether USD",
      icon: "/token/usdt.png",
      enabled: true,
      decimals: 6,
    },
    eth: {
      symbol: "ETH",
      name: "Ethereum",
      icon: "/token/eth.png", 
      enabled: true,
      decimals: 18,
    },
  };
  
  // Chain-Token mapping: defines which tokens are available on which chains
  export const CHAIN_TOKEN_SUPPORT: { [chainKey: string]: string[] } = {
    scroll: ["usdc", "usdt", "eth"],           // Scroll supports all tokens
    base: ["usdc", "usdt", "eth"],             // Base supports all tokens
    polygon: ["usdc", "usdt"],          // Polygon supports all tokens
    "op mainnet": ["usdc", "usdt", "eth"],     // Optimism supports all tokens (viem name: "OP Mainnet")
    "arbitrum one": ["usdc", "usdt", "eth"],   // Arbitrum supports all tokens (viem name: "Arbitrum One")
    scrollSepolia: ["usdc", "usdt", "eth"],    // Testnet supports all tokens
  };
  
  // Reverse mapping: which chains support each token
  export const TOKEN_CHAIN_SUPPORT: { [tokenSymbol: string]: string[] } = {
    usdc: ["scroll", "base", "polygon", "op mainnet", "arbitrum one", "scrollSepolia"],
    usdt: ["scroll", "base", "polygon", "op mainnet", "arbitrum one", "scrollSepolia"],
    eth: ["scroll", "base", "op mainnet", "arbitrum one", "scrollSepolia"],
  };
  
  // Helper functions
  export function getEnabledTokens(): TokenConfig[] {
    return Object.values(SUPPORTED_TOKENS).filter(token => token.enabled);
  }
  
  export function getAllTokens(): TokenConfig[] {
    return Object.values(SUPPORTED_TOKENS);
  }
  
  export function getTokenBySymbol(symbol: string): TokenConfig | undefined {
    return Object.values(SUPPORTED_TOKENS).find(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }
  
  /**
   * Get available tokens for a specific chain
   */
  export function getTokensForChain(chainKey: string): TokenConfig[] {
    // Normalize chain key to handle both simplified and viem names
    const normalizedChainKey = chainKey.toLowerCase();
    const supportedTokenKeys = CHAIN_TOKEN_SUPPORT[normalizedChainKey] || [];
    return supportedTokenKeys
      .map(tokenKey => SUPPORTED_TOKENS[tokenKey])
      .filter(token => token?.enabled);
  }
  
  /**
   * Get available chains for a specific token
   */
  export function getChainsForToken(tokenSymbol: string): string[] {
    return TOKEN_CHAIN_SUPPORT[tokenSymbol.toLowerCase()] || [];
  }
  
  /**
   * Check if a token is supported on a specific chain
   */
  export function isTokenSupportedOnChain(tokenSymbol: string, chainKey: string): boolean {
    const supportedChains = getChainsForToken(tokenSymbol);
    const normalizedChainKey = chainKey.toLowerCase();
    return supportedChains.includes(normalizedChainKey);
  }
  
  /**
   * Get enabled tokens for a specific chain (convenience function)
   */
  export function getEnabledTokensForChain(chainKey: string): TokenConfig[] {
    return getTokensForChain(chainKey).filter(token => token.enabled);
  }