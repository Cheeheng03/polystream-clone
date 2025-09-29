import React from "react";
import { Vault } from "../../data/vaults";
import { Copy, ExternalLink, TrendingUp } from "lucide-react";
import { getVaultConfig } from "@/app/lib/config/vaults";

interface VaultDetailsProps {
  vault: Vault;
}

const VaultDetails: React.FC<VaultDetailsProps> = ({ vault }) => {
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        getVaultConfig(vault.id)?.combinedVaultAddress || ""
      );
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format address to show first 6 and last 4 characters with ellipsis
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 9)}...${address.slice(-5)}`;
  };

  const contractAddress = getVaultConfig(vault.id)?.combinedVaultAddress;

  return (
    <div className="flex flex-col gap-6 mt-6 mb-12">
      {/* Performance Header */}
      {/* APY Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1">7D APY</div>
          <div className="text-xl font-bold text-green-600">
            {vault.apy7d.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1">30D APY</div>
          <div className="text-xl font-bold text-green-600">
            {vault.apy30d.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1">90D APY</div>
          <div className="text-xl font-bold text-green-600">
            {vault.apy90d.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Total Asset Card */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Assets Under Management (AUM)</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          $
          {vault.deposits.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="text-sm text-gray-500">Total funds invested in this strategy</div>
      </div>

      {/* Vault Contract Card */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Contract Address
          </h3>
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
              onClick={handleCopyAddress}
              title="Copy address"
            >
              <Copy size={16} className="text-gray-600" />
            </button>
            <a
              href={`https://scrollscan.com/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
              title="View on Etherscan"
            >
              <ExternalLink size={16} className="text-gray-600" />
            </a>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          {/* Mobile-friendly truncated address */}
          <div className="block sm:hidden">
            <code className="text-sm text-gray-700 font-mono">
              {formatAddress(contractAddress)}
            </code>
          </div>
          {/* Full address for larger screens */}
          <div className="hidden sm:block">
            <code className="text-sm text-gray-700 font-mono break-all leading-relaxed">
              {contractAddress}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultDetails;
