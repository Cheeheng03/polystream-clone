import { getVaultConfig, VAULT_CONFIGS, RiskLevel, TrendDirection } from "../lib/config/vaults";

// Types for vault data
export type { RiskLevel, TrendDirection } from "../lib/config/vaults";

export interface Pool {
  id: string;
  name: string;
  apy: number;
  isAllocated: boolean;
  logoUrl: string;
  description: string;
}

export interface Vault {
  id: string;
  name: string;
  apy: number;
  apy7d: number;
  apy30d: number;
  apy90d: number;
  deposits: number;
  liquidity: number;
  riskLevel: RiskLevel;
  trend: TrendDirection;
  color: string;
  pools: Pool[];
  active: boolean;
  stakedAmount?: number;
  totalYield?: number;
  yesterdayYield?: number;
  vaultAddress?: string;
}

// Helper function to create vault data from config + placeholders
function createVaultData(vaultId: string, placeholderData: {
  apy: number;
  apy7d: number;
  apy30d: number;
  apy90d: number;
  deposits: number;
  liquidity: number;
  pools: Pool[];
  stakedAmount?: number;
  totalYield?: number;
  yesterdayYield?: number;
}): Vault {
  const config = getVaultConfig(vaultId);
  if (!config) {
    throw new Error(`Vault config not found for ID: ${vaultId}`);
  }

  return {
    id: config.id,
    name: config.name,
    riskLevel: config.riskLevel,
    trend: config.trend,
    color: config.color,
    active: config.isActive,
    vaultAddress: config.virtualVaultAddress,
    ...placeholderData,
  };
}

// Mock data for vaults (placeholder data only)
export const vaults: Vault[] = [
  createVaultData("stableyield", {
    apy: 10.64,
    apy7d: 10.05,
    apy30d: 9.84,
    apy90d: 10.89,
    deposits: 200.48,
    liquidity: 192.56,
    pools: [
      {
        id: "aave",
        name: "Aave",
        apy: 4.5,
        isAllocated: true,
        logoUrl: "/aave.png",
        description: "Aave is a platform that allows digital assets to be lent out to earn interest or borrowed with a collateral. It is known for being stable and having high liquidity.",
      },
      {
        id: "compound",
        name: "Compound",
        apy: 3.8,
        isAllocated: false,
        logoUrl: "/compound.png",
        description: "Compound is a lending protocol where digital assets can be supplied to earn interest or used as collateral to borrow. It adjusts rates automatically based on market activity.",
      },
    ],
  }),
  createVaultData("degenyield", {
    apy: 15.24,
    apy7d: 14.88,
    apy30d: 15.67,
    apy90d: 14.95,
    deposits: 128.44,
    liquidity: 119.32,
    pools: [
      {
        id: "compound", 
        name: "Compound",
        apy: 5.3,
        isAllocated: true,
        logoUrl: "/compound.png",
        description: "An algorithmic, autonomous interest rate protocol built for developers to unlock new financial applications.",
      },
    ],
  }),
];

// Helper functions to get vault data
export const getVaultById = (id: string): Vault | undefined => {
  return vaults.find((vault) => vault.id === id);
};

export const getVaultsByRiskLevel = (riskLevel: RiskLevel): Vault[] => {
  return vaults.filter((vault) => vault.riskLevel === riskLevel);
};

export const getVaultsByTrend = (trend: TrendDirection): Vault[] => {
  return vaults.filter((vault) => vault.trend === trend);
};

export const getTopVaultsByApy = (limit: number = 5): Vault[] => {
  return [...vaults].sort((a, b) => b.apy - a.apy).slice(0, limit);
};

export const getTopVaultsByDeposits = (limit: number = 5): Vault[] => {
  return [...vaults].sort((a, b) => b.deposits - a.deposits).slice(0, limit);
};
