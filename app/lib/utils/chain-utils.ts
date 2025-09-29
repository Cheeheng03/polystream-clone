/**
 * Chain utility functions for consistent chain name mapping
 */

import { VaultConfig } from "../config/vaults";
import { JsonRpcProvider, Contract } from "ethers";

/**
 * Maps viem chain names to our lowercase chain keys used in SUPPORTED_CHAINS
 * @param chainName - The chain name from viem (e.g., "Scroll", "Base", "OP Mainnet", "Arbitrum One")
 * @returns The lowercase chain key (e.g., "scroll", "base", "optimism", "arbitrum")
 */
export function getChainKey(chainName: string): string {
  // Map viem chain names to our lowercase keys
  const chainNameMap: { [key: string]: string } = {
    Scroll: "scroll",
    "Scroll Sepolia": "scrollSepolia",
    Base: "base",
    Polygon: "polygon",
    "OP Mainnet": "optimism",
    Optimism: "optimism",
    "Arbitrum One": "arbitrum",
    Arbitrum: "arbitrum",
  };

  return chainNameMap[chainName] || chainName.toLowerCase();
}

/**
 * Maps our chain keys back to display names
 * @param chainKey - The lowercase chain key (e.g., "scroll", "base", "optimism", "arbitrum")
 * @returns The display name (e.g., "Scroll", "Base", "OP Mainnet", "Arbitrum One")
 */
export function getChainDisplayName(chainKey: string): string {
  const displayNameMap: { [key: string]: string } = {
    scroll: "Scroll",
    scrollSepolia: "Scroll Sepolia",
    base: "Base",
    polygon: "Polygon",
    optimism: "OP Mainnet",
    arbitrum: "Arbitrum One",
  };

  return displayNameMap[chainKey] || chainKey;
}

/**
 * Fetches protocol token balances for a given vault and returns formatted values.
 * @param provider ethers.js provider
 * @param vault VaultConfig object
 * @returns Record of protocol label to formatted balance (number)
 */
export async function getVaultProtocolBalances(
  provider: JsonRpcProvider,
  vault: VaultConfig
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  for (const tokenInfo of Object.values(vault.protocolTokens)) {
    const contract = new Contract(
      tokenInfo.address,
      tokenInfo.abi as any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
      provider
    );
    const raw = await contract.balanceOf(vault.combinedVaultAddress);
    // Assume USDC (6 decimals) for now; can be made dynamic if needed
    results[tokenInfo.label] = Number(raw.toString()) / 1e6;
  }
  return results;
}

/**
 * Fetches and logs protocol token balances for a given vault (formatted).
 * @param provider ethers.js provider
 * @param vault VaultConfig object
 */
export async function logVaultProtocolBalances(
  provider: JsonRpcProvider,
  vault: VaultConfig
) {
  const balances = await getVaultProtocolBalances(provider, vault);
  for (const [label, formatted] of Object.entries(balances)) {
    console.log(`${vault.name} - ${label} balance:`, formatted);
  }
}

// Example usage (uncomment and provide a real provider to test):
// import { getVaultConfig } from "../config/vaults";
// const provider = new ethers.providers.JsonRpcProvider(YOUR_RPC_URL);
// const vault = getVaultConfig("stableyield");
// if (vault) logVaultProtocolBalances(provider, vault);
