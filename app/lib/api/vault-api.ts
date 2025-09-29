'use client';

import { createPublicClient, http, formatUnits } from "viem";
import { getChainConfig } from "../config/chains";
import { getVaultConfig, getActiveVaults, VaultConfig } from "../config/vaults";
import { COMBINED_VAULT_ABI } from "../abis/combinedVault";
import { Vault } from "../../data/vaults";
import { vaults as staticVaults } from "../../data/vaults";

// Interface for VaultAPI to ensure consistency
interface VaultApiInterface {
  getVaults(getAccessToken?: () => Promise<string>): Promise<Vault[]>;
  getVaultById(id: string, getAccessToken?: () => Promise<string>): Promise<Vault | undefined>;
  getAverageApy(vaultId: string): Promise<number>;
  getApyHistory(vaultId: string, getAccessToken?: () => Promise<string>): Promise<{ apy7d: number; apy30d: number; apy90d: number }>;
  getTotalAssets(vaultId: string): Promise<number>;
}

// Interface for APY history response from backend
interface ApyHistoryResponse {
  vault_address: string;
  data: {
    apy_7d?: number;
    apy_30d?: number;
    apy_90d?: number;
  };
}

class VaultAPI implements VaultApiInterface {
  private static instance: VaultAPI;
  private cachedVaults: Vault[] = [];
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  static getInstance(): VaultAPI {
    if (!VaultAPI.instance) {
      VaultAPI.instance = new VaultAPI();
    }
    return VaultAPI.instance;
  }

  /**
   * Get APY history from the server-side API route
   */
  async getApyHistory(vaultId: string, getAccessToken?: () => Promise<string>): Promise<{ apy7d: number; apy30d: number; apy90d: number }> {
    try {
      const vaultConfig = getVaultConfig(vaultId);
      if (!vaultConfig || !vaultConfig.isActive) {
        return { apy7d: 0, apy30d: 0, apy90d: 0 };
      }

      // Use the combined vault address for the API call
      const vaultAddress = vaultConfig.combinedVaultAddress;
      const url = `/api/vaults/${vaultAddress}/apy-history`;

      // Prepare headers
      const headers: Record<string, string> = {
        'accept': 'application/json',
      };

      // Add authorization header if getAccessToken is provided
      if (getAccessToken) {
        const token = await getAccessToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: ApyHistoryResponse = await response.json();

      return {
        apy7d: data.data.apy_7d || 0,
        apy30d: data.data.apy_30d || 0,
        apy90d: data.data.apy_90d || 0,
      };
    } catch (error) {
      // Return fallback values if API call fails
      return this.getFallbackApyHistory(vaultId);
    }
  }

  /**
   * Get average APY from the combined vault contract
   */
  async getAverageApy(vaultId: string): Promise<number> {
    try {
      const vaultConfig = getVaultConfig(vaultId);
      if (!vaultConfig || !vaultConfig.isActive) {
        return 0;
      }

      // Get Scroll chain config (vaults are deployed on Scroll)
      const scrollChainConfig = getChainConfig('scroll');
      
      // Create public client for reading contract data
      const publicClient = createPublicClient({
        chain: scrollChainConfig.chain,
        transport: scrollChainConfig.secureTransport
      });

      // Read the getAverageApy function from the combined vault contract
      const averageApyRaw = await publicClient.readContract({
        address: vaultConfig.combinedVaultAddress,
        abi: COMBINED_VAULT_ABI,
        functionName: "getAverageApy",
      }) as bigint;

      // Convert from basis points to percentage (10000 basis points = 100%)
      const averageApyPercentage = parseFloat(formatUnits(averageApyRaw, 2)); // 2 decimals for basis points to percentage

      return averageApyPercentage;
    } catch (error) {
      // Return fallback APY if contract call fails
      return this.getFallbackApy(vaultId);
    }
  }

  /**
   * Get all vaults with updated APY from contracts and historical data from API
   */
  async getVaults(getAccessToken?: () => Promise<string>): Promise<Vault[]> {
    try {
      // Check if cache is still valid
      const now = Date.now();
      if (this.cachedVaults.length > 0 && (now - this.lastCacheUpdate) < this.CACHE_DURATION) {
        return [...this.cachedVaults];
      }

      // Start with static vault data
      const vaultsWithUpdatedData: Vault[] = [];

      for (const vault of staticVaults) {
        try {
          // Get real-time APY from contract for active vaults
          let currentApy = vault.apy; // fallback to static APY
          let historicalApy = { apy7d: vault.apy7d, apy30d: vault.apy30d, apy90d: vault.apy90d };
          let totalDeposits = vault.deposits; // fallback to static deposits
          
          if (vault.active) {
            // Fetch current APY from contract
            const contractApy = await this.getAverageApy(vault.id);
            if (contractApy > 0) {
              currentApy = contractApy;
            }

            // Fetch historical APY data from backend API
            const historyData = await this.getApyHistory(vault.id, getAccessToken);
            if (historyData.apy7d > 0 || historyData.apy30d > 0 || historyData.apy90d > 0) {
              historicalApy = historyData;
            }

            // Fetch total assets (deposits) from contract
            const contractTotalAssets = await this.getTotalAssets(vault.id);
            totalDeposits = contractTotalAssets;
          }

          // Create updated vault object
          const updatedVault: Vault = {
            ...vault,
            apy: currentApy,
            apy7d: historicalApy.apy7d,
            apy30d: historicalApy.apy30d,
            apy90d: historicalApy.apy90d,
            deposits: totalDeposits,
          };

          vaultsWithUpdatedData.push(updatedVault);
          
        } catch (error) {
          // Use static data as fallback
          vaultsWithUpdatedData.push({ ...vault });
        }
      }

      // Update cache
      this.cachedVaults = vaultsWithUpdatedData;
      this.lastCacheUpdate = now;

      return [...vaultsWithUpdatedData];

    } catch (error) {
      // Return static data as fallback
      return [...staticVaults];
    }
  }

  /**
   * Get a specific vault by ID with updated APY
   */
  async getVaultById(id: string, getAccessToken?: () => Promise<string>): Promise<Vault | undefined> {
    try {
      // For individual vault requests, always get fresh data
      const vaults = await this.getVaults(getAccessToken);
      return vaults.find(vault => vault.id === id);
    } catch (error) {
      // Fallback to static data
      return staticVaults.find(vault => vault.id === id);
    }
  }

  /**
   * Get fallback APY for vaults when contract calls fail
   */
  private getFallbackApy(vaultId: string): number {
    const staticVault = staticVaults.find(vault => vault.id === vaultId);
    return staticVault?.apy || 0;
  }

  /**
   * Get fallback APY history for vaults when API calls fail
   */
  private getFallbackApyHistory(vaultId: string): { apy7d: number; apy30d: number; apy90d: number } {
    const staticVault = staticVaults.find(vault => vault.id === vaultId);
    return {
      apy7d: staticVault?.apy7d || 0,
      apy30d: staticVault?.apy30d || 0,
      apy90d: staticVault?.apy90d || 0,
    };
  }

  /**
   * Get fallback total assets for vaults when contract calls fail
   */
  private getFallbackTotalAssets(vaultId: string): number {
    const staticVault = staticVaults.find(vault => vault.id === vaultId);
    return staticVault?.deposits || 0;
  }

  /**
   * Clear cached data (useful for testing or forced refresh)
   */
  clearCache(): void {
    console.log("🗑️ Clearing vault cache");
    this.cachedVaults = [];
    this.lastCacheUpdate = 0;
  }

  /**
   * Get total assets (deposits) from both virtual vault and combined vault contracts
   */
  async getTotalAssets(vaultId: string): Promise<number> {
    try {
      const vaultConfig = getVaultConfig(vaultId);
      if (!vaultConfig || !vaultConfig.isActive) {
        return 0;
      }

      // Get Scroll chain config (vaults are deployed on Scroll)
      const scrollChainConfig = getChainConfig('scroll');
      
      // Create public client for reading contract data
      const publicClient = createPublicClient({
        chain: scrollChainConfig.chain,
        transport: scrollChainConfig.secureTransport
      });

      // Read totalAssets from both virtual vault and combined vault contracts
      const [virtualVaultAssetsRaw, combinedVaultAssetsRaw] = await Promise.all([
        publicClient.readContract({
          address: vaultConfig.virtualVaultAddress,
          abi: COMBINED_VAULT_ABI, // Both use same ABI structure for totalAssets
          functionName: "totalAssets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultConfig.combinedVaultAddress,
          abi: COMBINED_VAULT_ABI,
          functionName: "totalAssets",
        }) as Promise<bigint>
      ]);

      // Convert from wei to USDC (6 decimals) and add them together
      const virtualVaultAssets = parseFloat(formatUnits(virtualVaultAssetsRaw, 6));
      const combinedVaultAssets = parseFloat(formatUnits(combinedVaultAssetsRaw, 6));
      const totalAssets = virtualVaultAssets + combinedVaultAssets;

      console.log(`[${vaultId}] Virtual Vault Assets: ${virtualVaultAssets}, Combined Vault Assets: ${combinedVaultAssets}, Total: ${totalAssets}`);

      // Round to 2 decimal places for consistent display
      return Math.round(totalAssets * 100) / 100;
    } catch (error) {
      console.warn(`Failed to fetch total assets for vault ${vaultId}:`, error);
      // Return 0 instead of fallback mock data
      return 0;
    }
  }
}

export const vaultAPI = VaultAPI.getInstance();