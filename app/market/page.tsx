"use client";

import { useRouter } from "next/navigation";
import TabNavigation from "../components/ui/TabNavigation";
import React from "react";
import { VaultTable } from "../components/market/VaultsList";
import { useVaults, useIndividualVaultBalances } from "../lib/hooks";
import { SkeletonCard } from "../components/ui/skeletons";
import { PullToRefresh } from "../components/PullToRefresh";

export default function Market() {
  const router = useRouter();
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { data: individualVaultBalances, isLoading: vaultBalancesLoading } = useIndividualVaultBalances();

  const handleVaultClick = (vaultId: string) => {
    router.push(`/vault/${vaultId}`);
  };

  return (
    <main className="flex min-h-screen flex-col pb-10 bg-background">
      <PullToRefresh refreshType="market">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold mb-6 text-foreground">Market</h1>
          </div>

          {/* Vaults Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-foreground">
                Explore Strategies
              </h2>
            </div>
            
            {vaultsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vaults ? (
              <VaultTable
                vaults={vaults}
                onVaultClick={handleVaultClick}
                individualVaultBalances={individualVaultBalances || undefined}
                isUserDataLoading={vaultBalancesLoading}
              />
            ) : (
              <div>No vaults available</div>
            )}
          </div>
        </div>
      </PullToRefresh>

      <TabNavigation activeTab="vault" />
    </main>
  );
}
