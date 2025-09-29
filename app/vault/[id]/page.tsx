"use client";

import { useParams, useSearchParams } from "next/navigation";
import VaultDetails from "../../components/vault/VaultInfo";
import { motion, AnimatePresence } from "framer-motion";
import { useVault, useVaultPosition, useTotalAssets } from "../../lib/hooks";
import {
  SkeletonCard,
  TransactionsSkeleton,
} from "../../components/ui/skeletons";
import { Skeleton } from "../../components/ui/skeleton";
import { useState, useEffect } from "react";
import { logVaultProtocolBalances } from "../../lib/utils/chain-utils";
import { JsonRpcProvider } from "ethers";
import { getVaultConfig } from "../../lib/config/vaults";

export default function VaultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vaultId = params?.id as string;
  const isFromBack = searchParams?.get("from") === "back";
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use our hooks to fetch vault and position data
  const { data: vault, isLoading: vaultLoading } = useVault(vaultId);
  const { data: position, isLoading: positionLoading } =
    useVaultPosition(vaultId);

  // OPTIMIZED: Use same data source as home page (useTotalAssets) instead of useUserData
  const {
    totalAssets,
    walletBalance,
    vaultBalance,
    isLoading: totalAssetsLoading,
  } = useTotalAssets();

  // Use real vault balance from totalAssets (same source as home page)
  const displayStakedAmount =
    vaultBalance > 0 ? vaultBalance : position?.stakedAmount || 0;
  const displayTotalYield = vaultBalance > 0 ? 0 : position?.totalYield || 0; // TODO: Add real yield calculation later
  const displayYesterdayYield =
    vaultBalance > 0 ? 0 : position?.yesterdayYield || 0; // TODO: Add real yield calculation later

  useEffect(() => {
    if (vault) {
      const vaultConfig = getVaultConfig(vault.id);
      if (vaultConfig) {
        const provider = new JsonRpcProvider("https://rpc.scroll.io");
        logVaultProtocolBalances(provider, vaultConfig);
      }
    }
  }, [vault]);

  if (vaultLoading || totalAssetsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="p-4 sticky top-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        {/* Balance Skeleton */}
        <div className="px-4 py-6">
          <SkeletonCard height="h-40" showDecorations={true}>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-48" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </SkeletonCard>
        </div>

        {/* Stats Skeleton */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard
                key={i}
                height="h-24"
                className="flex flex-col justify-center items-center"
              >
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </SkeletonCard>
            ))}
          </div>
        </div>

        {/* Transactions Skeleton */}
        <div className="px-4 pb-20">
          <Skeleton className="h-6 w-48 mb-4" />
          <TransactionsSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-foreground mb-2">
            Vault Not Found
          </h1>
          <p className="text-muted-foreground">
            The vault you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen h-screen bg-white flex flex-col"
        initial={isFromBack ? { x: 0 } : { x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div
          className={`flex-1 transition-all duration-200 ${
            isDrawerOpen ? "blur-sm" : ""
          }`}
        >
          <VaultDetails
            key={vaultId}
            vault={vault}
            stakedAmount={displayStakedAmount}
            totalYield={displayTotalYield}
            yesterdayYield={displayYesterdayYield}
            onDrawerOpenChange={setIsDrawerOpen}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
