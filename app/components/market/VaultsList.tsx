import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ArrowUp, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Vault } from "../../data/vaults";
import { UserData } from "../../lib/types";
import { motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";
import { getVaultConfig } from "@/app/lib/config/vaults";

type SortKey = "deposits" | "apy" | "riskLevel";
type SortDirection = "asc" | "desc";

interface VaultTableProps {
  vaults: Vault[];
  onVaultClick: (vaultId: string) => void;
  userData?: UserData;
  individualVaultBalances?: { [vaultId: string]: string };
  isUserDataLoading?: boolean;
}

export function VaultTable({
  vaults,
  onVaultClick,
  userData,
  individualVaultBalances,
  isUserDataLoading,
}: VaultTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("deposits");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const getRiskValue = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return 1;
      case "medium":
        return 2;
      case "high":
        return 3;
      default:
        return 0;
    }
  };

  const sortedVaults = [...vaults].sort((a, b) => {
    // Always prioritize active vaults first, regardless of sort key
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;

    // If both have same active status, sort by the selected criteria
    const dir = sortDirection === "asc" ? 1 : -1;

    if (sortKey === "riskLevel") {
      const riskA = getRiskValue(a.riskLevel);
      const riskB = getRiskValue(b.riskLevel);
      if (riskA < riskB) return -1 * dir;
      if (riskA > riskB) return 1 * dir;
      return 0;
    }

    // For deposits and APY, use the actual values since we're already grouping by active status
    if (sortKey === "deposits" || sortKey === "apy") {
      const valueA = a[sortKey];
      const valueB = b[sortKey];

      if (valueA < valueB) return -1 * dir;
      if (valueA > valueB) return 1 * dir;
      return 0;
    }

    // Default sorting for other keys
    if (a[sortKey] < b[sortKey]) return -1 * dir;
    if (a[sortKey] > b[sortKey]) return 1 * dir;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const SortButton = ({
    label,
    sortKey: buttonSortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) => {
    const isActive = sortKey === buttonSortKey;
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isActive
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        onClick={() => handleSort(buttonSortKey)}
      >
        <span>{label}</span>
        <motion.div
          initial={false}
          animate={{
            rotate: isActive ? (sortDirection === "asc" ? 0 : 180) : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <ArrowUp className="w-3 h-3" />
        </motion.div>
      </motion.button>
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 pt-2">
        <SortButton label="AUM" sortKey="deposits" />
        <SortButton label="APY" sortKey="apy" />
        <SortButton label="Risk" sortKey="riskLevel" />
      </div>
      {/* Cards */}
      <div className="space-y-3">
        {sortedVaults.map((vault) => {
          // Calculate real balance for any vault
          const realBalance = individualVaultBalances?.[vault.id]
            ? parseFloat(individualVaultBalances[vault.id])
            : 0;
          const hasPosition = realBalance > 0;

          return (
            <motion.div
              key={vault.id}
              className={`card-tap-effect market-card ${
                vault.active
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60"
              }`}
              onClick={vault.active ? () => onVaultClick(vault.id) : undefined}
            >
              <div className="market-card-content">
                {/* First row: Avatar, name, status, and arrow */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          getVaultConfig(vault.id)?.avatarUrl ||
                          `/${vault.id.toLowerCase()}.png`
                        }
                        alt={vault.name}
                      />
                      <AvatarFallback className="text-base font-semibold bg-white text-black">
                        {vault.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg text-foreground">
                          {vault.name}
                        </span>
                        {!vault.active && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            Coming Soon
                          </span>
                        )}
                        {isUserDataLoading ? (
                          <Skeleton className="h-5 w-16 rounded-full" />
                        ) : (
                          hasPosition && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              Position
                            </span>
                          )
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${getRiskColor(
                          vault.riskLevel
                        )}`}
                      >
                        {vault.riskLevel} Risk
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Stats: APY, deposits, and user position */}
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Annual Percentage Yield (APY)</span>
                    <span className="text-lg font-medium text-green-600">
                      {vault.active ? `${vault.apy.toFixed(2)}%` : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Assets Under Management <br /> (AUM)</span>
                    <span className="text-lg font-medium text-foreground">
                      {vault.active
                        ? `$${vault.deposits.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "--"}
                    </span>
                  </div>
                  {isUserDataLoading ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Your Position
                      </span>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ) : (
                    hasPosition && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Your Position
                        </span>
                        <span className="text-lg font-medium text-foreground">
                          ${realBalance.toFixed(2)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
