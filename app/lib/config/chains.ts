import { Chain } from "viem";
import { scrollSepolia, scroll, polygon, base, optimism, arbitrum } from "viem/chains";
import { entryPoint07Address } from "viem/account-abstraction";
import { createSecureTransport, createSecurePimlicoTransport } from "../utils/secure-api";

export interface ChainConfig {
  chain: Chain;
  rpcUrl: string;
  secureTransport: any; // Secure transport that uses server-side proxy
  pimlicoApiUrl: string;
  securePimlicoTransport: any; // Secure Pimlico transport
  entryPointAddress: `0x${string}`;
  entryPointVersion: "0.6" | "0.7";
  acrossSpokePoolAddress: `0x${string}`;
  explorerUrl: string; // Base URL for the block explorer
  tokens: { // Token addresses for the chain
    usdc: `0x${string}`;
    usdt?: `0x${string}`; // Optional USDT token address
    weth?: `0x${string}`; // Optional WETH token address
    bridgedusdc?: `0x${string}`; // Optional bridged USDC token address
  };
  // Add referral code for Odos swaps
  odosReferralCode?: number; // Optional referral code for this chain
  // Add Odos router address for this chain
  odosRouterAddress?: `0x${string}`;
}

export const SUPPORTED_CHAINS = {
  scrollSepolia: {
    chain: scrollSepolia,
    rpcUrl: "/api/rpc", // Use secure proxy instead of direct URL
    secureTransport: createSecureTransport('scrollSepolia'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('scrollSepolia'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "" as `0x${string}`, // not used for scroll sepolia
    explorerUrl: "https://sepolia.scrollscan.com",
    tokens: {
      usdc: "" as `0x${string}`,
      usdt: "" as `0x${string}`,
    },
    odosReferralCode: undefined, // No swaps on testnet
    odosRouterAddress: undefined,
  },
  scroll: {
    chain: scroll,
    rpcUrl: "/api/rpc", // Use secure proxy instead of exposing Alchemy API key
    secureTransport: createSecureTransport('scroll'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('scroll'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "0x3bad7ad0728f9917d1bf08af5782dcbd516cdd96" as `0x${string}`,
    explorerUrl: "https://scrollscan.com",
    tokens: {
      usdc: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" as `0x${string}`,
      usdt: "0xf55bec9cafdbe8730f096aa55dad6d22d44099df" as `0x${string}`,
      weth: "0x5300000000000000000000000000000000000004" as `0x${string}`, // WETH on Scroll
    },
    odosReferralCode: 2620173912, // Your registered code for Scroll
    odosRouterAddress: "0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1" as `0x${string}`,
  },
  polygon: {
    chain: polygon,
    rpcUrl: "/api/rpc", // Use secure proxy
    secureTransport: createSecureTransport('polygon'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('polygon'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096" as `0x${string}`, // Across Polygon SpokePool
    explorerUrl: "https://polygonscan.com",
    tokens: {
      usdc: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" as `0x${string}`, // Native USDC on Polygon
      usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as `0x${string}`, // USDT on Polygon
      weth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619" as `0x${string}`, // WETH on Polygon
      bridgedusdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`, // bridged USDC on Polygon (USDC.e)
    },
    odosReferralCode: 2620173912,
    odosRouterAddress: "0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf" as `0x${string}`, // Odos router on Polygon
  },
  base: {
    chain: base,
    rpcUrl: "/api/rpc", // Use secure proxy instead of exposing Alchemy API key
    secureTransport: createSecureTransport('base'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('base'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64" as `0x${string}`,
    explorerUrl: "https://basescan.org",
    tokens: {
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
      usdt: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as `0x${string}`, // USDT on Base
      weth: "0x4200000000000000000000000000000000000006" as `0x${string}`, // WETH on Base
    },
    odosReferralCode: 2620173912,
    odosRouterAddress: "0x19cEeAd7105607Cd444F5ad10dd51356436095a1" as `0x${string}`,
  },
  optimism: {
    chain: optimism,
    rpcUrl: "/api/rpc", // Use secure proxy
    secureTransport: createSecureTransport('optimism'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('optimism'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "0x6f26Bf09B1C792e3228e5467807a900A503c0281" as `0x${string}`, // Across Optimism SpokePool
    explorerUrl: "https://optimistic.etherscan.io",
    tokens: {
      usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as `0x${string}`, // Native USDC on Optimism
      usdt: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" as `0x${string}`, // USDT on Optimism
      weth: "0x4200000000000000000000000000000000000006" as `0x${string}`, // WETH on Optimism
      bridgedusdc: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" as `0x${string}`, // bridged USDC on Optimism (USDC.e)
    },
    odosReferralCode: 2620173912,
    odosRouterAddress: "0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680" as `0x${string}`,
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrl: "/api/rpc", // Use secure proxy
    secureTransport: createSecureTransport('arbitrum'),
    pimlicoApiUrl: "/api/pimlico", // Use secure proxy
    securePimlicoTransport: createSecurePimlicoTransport('arbitrum'),
    entryPointAddress: entryPoint07Address as `0x${string}`,
    entryPointVersion: "0.7" as const,
    acrossSpokePoolAddress: "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A" as `0x${string}`, // Across Arbitrum SpokePool
    explorerUrl: "https://arbiscan.io",
    tokens: {
      usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`, // Native USDC on Arbitrum
      usdt: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as `0x${string}`, // USDT on Arbitrum
      weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as `0x${string}`, // WETH on Arbitrum
      bridgedusdc: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" as `0x${string}`, // bridged USDC on Arbitrum (USDC.e)
    },
    odosReferralCode: 2620173912,
    odosRouterAddress: "0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13" as `0x${string}`,
  }
} as const;

export type SupportedChainKey = keyof typeof SUPPORTED_CHAINS;

// Active chains - smart accounts will be deployed to all of these
export const ACTIVE_CHAINS: SupportedChainKey[] = ["base", "scroll", "polygon", "optimism", "arbitrum"];

// Helper to get all active chain configs
export function getActiveChainConfigs(): ChainConfig[] {
  return ACTIVE_CHAINS.map(chainKey => SUPPORTED_CHAINS[chainKey]);
}

export function getSupportedChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS);
}

// Helper to get specific chain config
export function getChainConfig(chainKey: SupportedChainKey): ChainConfig {
  return SUPPORTED_CHAINS[chainKey];
}

// Helper to get secure Pimlico URL (now uses server-side proxy)
export function getPimlicoUrlForChain(chainConfig: ChainConfig): string {
  return chainConfig.pimlicoApiUrl; // This now points to /api/pimlico
}

// Helper to get secure Pimlico URL (uses first active chain for backward compatibility)
export function getPimlicoUrl(): string {
  const config = getActiveChainConfigs()[0];
  return config.pimlicoApiUrl; // This now points to /api/pimlico
}

// Helper to get secure RPC URL (uses first active chain for backward compatibility)
export function getRpcUrl(): string {
  const config = getActiveChainConfigs()[0];
  return config.rpcUrl; // This now points to /api/rpc
}

// Helper to get token address (uses first active chain for backward compatibility)
export function getTokenAddress(token: keyof ChainConfig['tokens']): `0x${string}` {
  const config = getActiveChainConfigs()[0];
  const address = config.tokens[token];
  if (!address) {
    throw new Error(`Token ${token} not available on ${config.chain.name}`);
  }
  return address;
}

// Network name to chain mapping
const NETWORK_TO_CHAIN_MAPPING: { [key: string]: SupportedChainKey } = {
  'scroll': 'scroll',
  'scroll mainnet': 'scroll',
  'scroll sepolia': 'scrollSepolia',
  'scroll testnet': 'scrollSepolia',
  'base': 'base',
  'polygon': 'polygon',
  'optimism': 'optimism',
  'arbitrum': 'arbitrum'
};

// Helper to check if a chain supports Odos swaps
export function chainSupportsOdosSwaps(chainKey: SupportedChainKey): boolean {
  const config = getChainConfig(chainKey);
  return !!(config.odosReferralCode && config.odosRouterAddress);
}

// Helper to get chains that support swaps
export function getSwapSupportedChains(): SupportedChainKey[] {
  return ACTIVE_CHAINS.filter(chainSupportsOdosSwaps);
}

// Helper to get chain config by network name
export function getChainByNetworkName(networkName: string): ChainConfig {
  const networkLower = networkName.toLowerCase();
  const chainKey = NETWORK_TO_CHAIN_MAPPING[networkLower];

  if (chainKey && SUPPORTED_CHAINS[chainKey]) {
    return SUPPORTED_CHAINS[chainKey];
  }

  // Fallback to scroll if no match found
  return SUPPORTED_CHAINS.scroll;
}

// Helper to get token contract URL for a specific chain and token
export function getTokenContractUrl(chainConfig: ChainConfig, tokenSymbol: string): string {
  const tokenLower = tokenSymbol.toLowerCase();
  const tokenAddress = chainConfig.tokens[tokenLower as keyof ChainConfig['tokens']];

  // Return empty string if token address is not defined for this chain
  if (!tokenAddress) {
    console.warn(`Token ${tokenSymbol} not supported on chain ${chainConfig.chain.name}`);
    return '';
  }

  const chainName = chainConfig.chain.name.toLowerCase();

  switch (chainName) {
    case 'scroll':
      return `${chainConfig.explorerUrl}/address/${tokenAddress}`;
    case 'scroll sepolia':
      return `${chainConfig.explorerUrl}/address/${tokenAddress}`;
    case 'base':
      return `${chainConfig.explorerUrl}/token/${tokenAddress}`;
    case 'polygon':
      return `${chainConfig.explorerUrl}/token/${tokenAddress}`;
    case 'optimism':
      return `${chainConfig.explorerUrl}/token/${tokenAddress}`;
    case 'arbitrum':
      return `${chainConfig.explorerUrl}/token/${tokenAddress}`;
    default:
      return `${chainConfig.explorerUrl}/address/${tokenAddress}`;
  }
}