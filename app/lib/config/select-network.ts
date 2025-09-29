import { getTokensForChain, getChainsForToken, isTokenSupportedOnChain } from './select-token';

export interface NetworkConfig {
  name: string;
  displayName: string;
  icon: string;
  enabled: boolean;
  chainKey: string; // Links to SUPPORTED_CHAINS keys
}

export const SUPPORTED_NETWORKS: { [key: string]: NetworkConfig } = {
  scroll: {
    name: "Scroll", 
    displayName: "Scroll",
    icon: "/scroll.png",
    enabled: true,
    chainKey: "scroll",
  },
  base: {
    name: "Base",
    displayName: "Base",
    icon: "/base.png", 
    enabled: true,
    chainKey: "base",
  },
  polygon: {
    name: "Polygon",
    displayName: "Polygon",
    icon: "/polygon.png",
    enabled: true, // Now enabled
    chainKey: "polygon",
  },
  optimism: {
    name: "Optimism",
    displayName: "Optimism",
    icon: "/optimism.png",
    enabled: true, // Now enabled
    chainKey: "op mainnet",
  },
  arbitrum: {
    name: "Arbitrum",
    displayName: "Arbitrum",
    icon: "/arbitrum.png",
    enabled: true, // Now enabled
    chainKey: "arbitrum one",
  },
};

// Helper functions
export function getEnabledNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS).filter(network => network.enabled);
}

export function getAllNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS);
}

export function getNetworkByName(name: string): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find(network => 
    network.name.toLowerCase() === name.toLowerCase() ||
    network.displayName.toLowerCase() === name.toLowerCase()
  );
}

export function getNetworkByChainKey(chainKey: string): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find(network => 
    network.chainKey === chainKey
  );
}

/**
 * Get networks that support a specific token
 */
export function getNetworksForToken(tokenSymbol: string): NetworkConfig[] {
  const supportedChainKeys = getChainsForToken(tokenSymbol);
  return supportedChainKeys
    .map(chainKey => getNetworkByChainKey(chainKey))
    .filter((network): network is NetworkConfig => network !== undefined && network.enabled);
}

/**
 * Get enabled networks that support a specific token (convenience function)
 */
export function getEnabledNetworksForToken(tokenSymbol: string): NetworkConfig[] {
  return getNetworksForToken(tokenSymbol).filter(network => network.enabled);
}

/**
 * Check if a network supports a specific token
 */
export function doesNetworkSupportToken(chainKey: string, tokenSymbol: string): boolean {
  return isTokenSupportedOnChain(tokenSymbol, chainKey);
}

/**
 * Get available tokens for a network (re-export for convenience)
 */
export function getTokensForNetwork(chainKey: string) {
  return getTokensForChain(chainKey);
}