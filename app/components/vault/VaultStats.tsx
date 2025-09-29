import React from "react";
import { Vault } from "../../data/vaults";
import { useUserData } from "../../lib/hooks";

interface VaultStatsProps {
  stakedAmount: number;
  totalYield: number;
  yesterdayYield: number;
  vault: Vault;
}

const VaultStats: React.FC<VaultStatsProps> = ({
  stakedAmount,
  totalYield,
  yesterdayYield,
  vault,
}) => {
  const { data: userData } = useUserData();
  
  // Get real vault breakdown for stableyield
  const virtualVaultBalance = vault.id === 'stableyield' && userData ? 
    parseFloat(userData.virtualVault?.withdrawableUsdc || "0") : 0;
  const combinedVaultBalance = vault.id === 'stableyield' && userData ? 
    parseFloat(userData.combinedVault?.withdrawableUsdc || "0") : 0;
  const showVaultBreakdown = vault.id === 'stableyield' && 
    (virtualVaultBalance > 0 || combinedVaultBalance > 0);

  return (
    <div className="bg-white rounded-4xl px-2 border-b">
      <div className="flex flex-col p-4">
        <div className="flex items-center mb-2">
          <span className="text-sm text-black font-medium">Total Invested</span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-regular text-black">
            $
            {stakedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {/* Yield information */}
        <div className="flex items-center gap-12 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total Profits</span>
            <span className="text-sm font-medium text-green-600">
              +$
              {totalYield.toLocaleString(undefined, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Yesterday</span>
            <span className="text-sm font-medium text-green-600">
              +$
              {yesterdayYield.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Est. APY</span>
            <span className="text-sm font-medium text-green-600">
              {vault.apy.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultStats;
