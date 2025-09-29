import { VIRTUAL_VAULT_ABI } from "../abis/virtualVault";
import { COMBINED_VAULT_ABI } from "../abis/combinedVault";
import { ERC20_ABI } from "../abis/erc20";

// Types
export type RiskLevel = "Low" | "Medium" | "High";
export type TrendDirection = "up" | "down" | "stable";

// Vault configuration interface
export interface VaultConfig {
  id: string;
  name: string;
  risk: string;
  riskLevel: RiskLevel;
  trend: TrendDirection;
  color: string;
  virtualVaultAddress: `0x${string}`;
  combinedVaultAddress: `0x${string}`;
  virtualVaultAbi: readonly any[];
  combinedVaultAbi: readonly any[];
  depositMethod: string;
  withdrawMethod: string;
  isActive: boolean;
  chainId: number; // Target chain for this vault (534352 for Scroll)
  avatarUrl: string; // URL to the vault's avatar image
  protocolTokens: {
    [protocol: string]: {
      address: `0x${string}`;
      abi: readonly unknown[];
      label: string;
    };
  };
}

// Vault configurations for all supported vaults
export const VAULT_CONFIGS: Record<string, VaultConfig> = {
  stableyield: {
    id: "stableyield",
    name: "Stable Yield",
    risk: "low",
    riskLevel: "Low",
    trend: "up",
    color: "#E9F7EF",
    virtualVaultAddress:
      "0x921bE808782590115c675CDA86B3aB61b55B502c" as `0x${string}`,
    combinedVaultAddress:
      "0x11C8D7894A582199CBf400dabFe0Be2fC3BB3176" as `0x${string}`,
    virtualVaultAbi: VIRTUAL_VAULT_ABI,
    combinedVaultAbi: COMBINED_VAULT_ABI,
    depositMethod: "deposit",
    withdrawMethod: "withdraw",
    isActive: true,
    chainId: 534352, // Scroll mainnet
    avatarUrl: "/stable.png",
    protocolTokens: {
      aave: {
        address: "0x1D738a3436A8C49CefFbaB7fbF04B660fb528CbD",
        abi: ERC20_ABI,
        label: "Aave",
      },
      compound: {
        address: "0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44",
        abi: ERC20_ABI,
        label: "Compound",
      },
    },
  },
  degenyield: {
    id: "degenyield",
    name: "Degen Yield",
    risk: "medium",
    riskLevel: "Medium",
    trend: "stable",
    color: "#EFF8FF",
    virtualVaultAddress:
      "0xb324926B0Ff470Dc8F9473898cC2402f37e579F3" as `0x${string}`,
    combinedVaultAddress:
      "0xAeEE8524b4ED4659805882664493Ca78E2B57c1F" as `0x${string}`,
    virtualVaultAbi: VIRTUAL_VAULT_ABI,
    combinedVaultAbi: COMBINED_VAULT_ABI,
    depositMethod: "deposit",
    withdrawMethod: "withdraw",
    isActive: false,
    chainId: 534352, // Scroll mainnet
    avatarUrl: "/degen.png",
    protocolTokens: {},
  },
  ethrestaking: {
    id: "ethrestaking",
    name: "ETH Restaking",
    risk: "high",
    riskLevel: "High",
    trend: "down",
    color: "#FFF5F5",
    virtualVaultAddress: "" as `0x${string}`,
    combinedVaultAddress: "" as `0x${string}`,
    virtualVaultAbi: VIRTUAL_VAULT_ABI, // placeholder
    combinedVaultAbi: COMBINED_VAULT_ABI,
    depositMethod: "deposit",
    withdrawMethod: "withdraw",
    isActive: false,
    chainId: 534352, // Scroll mainnet
    avatarUrl: "/eth.png",
    protocolTokens: {},
  },
  btcstrategy: {
    id: "btcstrategy",
    name: "BTC Strategy",
    risk: "high",
    riskLevel: "High",
    trend: "up",
    color: "#F0FFF4",
    virtualVaultAddress: "" as `0x${string}`,
    combinedVaultAddress: "" as `0x${string}`,
    virtualVaultAbi: VIRTUAL_VAULT_ABI, // placeholder
    combinedVaultAbi: COMBINED_VAULT_ABI,
    depositMethod: "deposit",
    withdrawMethod: "withdraw",
    isActive: false,
    chainId: 534352, // Scroll mainnet
    avatarUrl: "/btc.png",
    protocolTokens: {},
  },
} as const;

// Helper functions
export function getVaultConfig(vaultId: string): VaultConfig | undefined {
  return VAULT_CONFIGS[vaultId];
}

export function getActiveVaults(): VaultConfig[] {
  return Object.values(VAULT_CONFIGS).filter((vault) => vault.isActive);
}

export function isVaultActive(vaultId: string): boolean {
  const vault = getVaultConfig(vaultId);
  return vault?.isActive ?? false;
}

// Map vault contract addresses to vault names
export function getVaultNameByAddress(address: string): string | null {
  const normalizedAddress = address.toLowerCase();

  for (const vault of Object.values(VAULT_CONFIGS)) {
    if (
      vault.virtualVaultAddress.toLowerCase() === normalizedAddress ||
      vault.combinedVaultAddress.toLowerCase() === normalizedAddress
    ) {
      return vault.name;
    }
  }

  return null;
}

// Create address-to-vault mapping for quick lookups
export const VAULT_ADDRESS_TO_NAME: Record<string, string> = {};

// Populate the mapping
Object.values(VAULT_CONFIGS).forEach((vault) => {
  if (vault.virtualVaultAddress) {
    VAULT_ADDRESS_TO_NAME[vault.virtualVaultAddress.toLowerCase()] = vault.name;
  }
  if (vault.combinedVaultAddress) {
    VAULT_ADDRESS_TO_NAME[vault.combinedVaultAddress.toLowerCase()] =
      vault.name;
  }
});
