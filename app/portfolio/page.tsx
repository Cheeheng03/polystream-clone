"use client";

import { useState, useRef, useMemo } from "react";
import TabNavigation from "../components/ui/TabNavigation";
import UserProfile from "../components/portfolio/TotalAssets";
import Assets from "../components/portfolio/ActiveVaults";
import { motion, AnimatePresence } from "framer-motion";
import Wallet from "../components/portfolio/WalletBalance";
import { ProfileHeader } from "../components/ui/profile-header";
import { usePathname } from "next/navigation";
import { PullToRefresh } from "../components/PullToRefresh";
import {
  useVaults,
  useWallet,
  useInfiniteTransactions,
  useMultiChainSmartWallet,
  useIndividualVaultBalances,
  useAllTransactions,
  useRefreshWalletBalances,
} from "../lib/hooks";
import { getVaultConfig } from "../lib/config/vaults";
import { Transaction } from "../lib/types";
import { TransactionsSkeleton, SkeletonCard } from "../components/ui/skeletons";
import { Skeleton } from "../components/ui/skeleton";
import Link from "next/link";
import React from "react";

export default function Portfolio() {
  const [showHistory, setShowHistory] = useState(false);
  const [showBuyDrawer, setShowBuyDrawer] = useState(false);
  const [showTransferDrawer, setShowTransferDrawer] = useState(false);
  const [showWalletBreakdown, setShowWalletBreakdown] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Get refresh function for wallet balances
  const refreshWalletBalances = useRefreshWalletBalances();
  // Fetch data using React Query hooks
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: individualVaultBalances, isLoading: vaultBalancesLoading } =
    useIndividualVaultBalances();

  // Fetch transactions to calculate real yield
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const walletAddress = multiChainWalletData?.smartAccountAddress;

  // Fetch ALL transactions for yield calculation using the hook
  const { data: allTransactions, isLoading: transactionsLoading } =
    useAllTransactions(walletAddress || "");

  // Calculate vault-specific yields from transactions
  const vaultYields = useMemo(() => {
    if (!allTransactions || !vaults) return {};

    const yields: { [vaultId: string]: number } = {};

    vaults.forEach((vault) => {
      const vaultConfig = getVaultConfig(vault.id);
      if (!vaultConfig) {
        yields[vault.id] = 0;
        return;
      }

      // Filter accrue transactions for this specific vault
      const vaultAccrueTransactions = allTransactions.filter(
        (tx: Transaction) => {
          const isAccrue = tx.type === "accrue";
          const matchesVaultId = tx.vaultId === vault.id;
          const matchesFromAddress =
            tx.fromAddress &&
            (tx.fromAddress.toLowerCase() ===
              vaultConfig.virtualVaultAddress.toLowerCase() ||
              tx.fromAddress.toLowerCase() ===
                vaultConfig.combinedVaultAddress.toLowerCase());

          const matches = isAccrue && (matchesVaultId || matchesFromAddress);

          return matches;
        }
      );

      const totalYield = vaultAccrueTransactions.reduce(
        (sum: number, tx: Transaction) => sum + tx.amount,
        0
      );
      yields[vault.id] = totalYield;
    });

    return yields;
  }, [allTransactions, vaults]);

  return (
    <AnimatePresence>
      <motion.main
        key={pathname}
        className="flex min-h-screen flex-col bg-background"
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        exit={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Portfolio Header */}
        {!showHistory && (
          <ProfileHeader
            showName={true}
            className={
              showBuyDrawer || showTransferDrawer || showWalletBreakdown
                ? "blur-sm transition-all duration-200"
                : ""
            }
            onSheetOpenChange={setIsProfileSheetOpen}
          />
        )}

        <PullToRefresh refreshType="portfolio">
          <div
            ref={contentRef}
            className={`flex-1 px-6 pb-22 overflow-y-auto transition-all duration-200 ${
              showBuyDrawer ||
              showTransferDrawer ||
              showWalletBreakdown ||
              isProfileSheetOpen
                ? "blur-sm"
                : ""
            }`}
          >
            {/* Main Portfolio Page */}
            {!showHistory && (
              <>
                <UserProfile />

                {/* Wallet Section */}
                {walletLoading ? (
                  <SkeletonCard height="h-24" className="mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-full" />
                    </div>
                  </SkeletonCard>
                ) : (
                  wallet && (
                    <Wallet
                      onDeposit={() => {
                        /* handle deposit */
                      }}
                      showBuyDrawer={showBuyDrawer}
                      setShowBuyDrawer={setShowBuyDrawer}
                      showTransferDrawer={showTransferDrawer}
                      setShowTransferDrawer={setShowTransferDrawer}
                      showWalletBreakdown={showWalletBreakdown}
                      setShowWalletBreakdown={setShowWalletBreakdown}
                    />
                  )
                )}

                {/* Active Vaults Section */}
                <h2 className="text-xl font-semibold mb-4 mt-6 ms-2">
                  Your Strategies
                </h2>
                {vaultsLoading || vaultBalancesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <SkeletonCard key={index} height="h-32">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                        </div>
                        <div className="w-full h-px bg-gray-200 my-2" />
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-32" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                      </SkeletonCard>
                    ))}
                  </div>
                ) : (
                  vaults &&
                  individualVaultBalances && (
                    <div>
                      {(() => {
                        // Filter vaults with balance > 0 using real data only
                        const vaultsWithBalance = vaults.filter((vault) => {
                          const vaultBalance = individualVaultBalances[vault.id]
                            ? parseFloat(individualVaultBalances[vault.id])
                            : 0;
                          return vaultBalance > 0;
                        });

                        // Calculate total balance across all vaults for yield distribution
                        const totalVaultBalance = vaultsWithBalance.reduce(
                          (sum, vault) => {
                            const vaultBalance = individualVaultBalances[
                              vault.id
                            ]
                              ? parseFloat(individualVaultBalances[vault.id])
                              : 0;
                            return sum + vaultBalance;
                          },
                          0
                        );

                        // Show message if no investments
                        if (vaultsWithBalance.length === 0) {
                          return (
                            <div className="bg-white rounded-3xl p-8 text-center">
                              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                No Active Strategies
                              </h3>
                              <p className="text-gray-500 mb-6">
                                Start earning yields by investing in our
                                strategies
                              </p>
                              <Link
                                href="/market"
                                className="inline-block bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                              >
                                Explore Strategies
                              </Link>
                            </div>
                          );
                        }

                        // Show vaults with balance
                        return vaultsWithBalance.map((vault) => {
                          const vaultBalance = individualVaultBalances[vault.id]
                            ? parseFloat(individualVaultBalances[vault.id])
                            : 0;

                          // Get vault-specific yield from pre-calculated yields with 3 decimal places
                          const totalYield = parseFloat(
                            (vaultYields[vault.id] || 0).toFixed(3)
                          );

                          return (
                            <Assets
                              key={vault.id}
                              id={vault.id}
                              name={vault.name}
                              risk={vault.riskLevel}
                              apy={vault.apy}
                              stakedAmount={vaultBalance}
                              totalYield={totalYield}
                              active={vault.active}
                              isIntegratedProfit={true}
                            />
                          );
                        });
                      })()}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </PullToRefresh>

        {/* Tab Navigation */}
        {!showBuyDrawer && !showTransferDrawer && (
          <TabNavigation activeTab="portfolio" />
        )}
      </motion.main>
    </AnimatePresence>
  );
}
