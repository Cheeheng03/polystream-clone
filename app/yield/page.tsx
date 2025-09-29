"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteTransactions, useMultiChainSmartWallet, useTotalYieldEarned } from "../lib/hooks";
import { TransactionsSkeleton } from "../components/ui/skeletons";
import { AICard } from "../components/ui/ai-card";
import { getVaultNameByAddress } from "../lib/config";

export default function YieldPage() {
  const router = useRouter();
  
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const walletAddress = multiChainWalletData?.smartAccountAddress;
  
  const { 
    transactions: allTransactions, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore 
  } = useInfiniteTransactions(walletAddress || '', 50); // Larger page size for yield search

  // Get total yield earned (separate from paginated transactions)
  const { data: totalYieldEarned, isLoading: isLoadingTotalYield } = useTotalYieldEarned(walletAddress || '');

  // Filter only yield transactions (accrue type) for the list display
  const yieldTransactions = allTransactions?.filter(tx => tx.type === 'accrue') || [];

  // Track if the last page had any yield transactions
  const hasMoreYield = React.useMemo(() => {
    if (!hasMore) {
      // If there are no more transactions at all, there are no more yield transactions
      return false;
    }
    
    if (!allTransactions || allTransactions.length === 0) {
      // If no transactions loaded yet, assume there might be yield transactions
      return true;
    }
    
    // Check if the most recent page (last 50 transactions) had any yield transactions
    const pageSize = 50;
    const lastPageTransactions = allTransactions.slice(-pageSize);
    const lastPageYieldTransactions = lastPageTransactions.filter(tx => tx.type === 'accrue');
    
    // If the last page had yield transactions, there might be more
    // If the last page had no yield transactions but we still have more transactions overall,
    // we should keep loading to find more yield transactions
    return lastPageYieldTransactions.length > 0 || hasMore;
  }, [allTransactions, hasMore]);

  return (
    <AnimatePresence>
      <motion.main
        className="flex min-h-screen flex-col bg-background"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-6 pb-4 border-b border-border fixed top-0 w-full bg-background z-10">
          <button
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Yield Earned</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 mt-20">
          {/* Total Yield Summary */}
          {isLoadingTotalYield ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <AICard>
                <div className="yield-card-bg">
                  <div className="text-center p-6">
                    <h2 className="text-sm font-medium mb-2 text-white/80">Total Yield Earned</h2>
                    <div className="flex justify-center mb-2">
                      <div className="h-9 w-48 bg-white/20 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex justify-center">
                      <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </AICard>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <AICard>
                <div className="yield-card-bg">
                  <div className="text-center p-6">
                    <h2 className="text-sm font-medium mb-2 text-white/90">Total Yield Earned</h2>
                    <p className="text-3xl font-bold text-white mb-1">+{(totalYieldEarned || 0).toFixed(6)} USDC</p>
                  </div>
                </div>
              </AICard>

              <style jsx>{`
                .yield-card-bg {
                  background: linear-gradient(135deg, 
                    #10b981 0%, 
                    #059669 25%, 
                    #047857 50%, 
                    #065f46 75%, 
                    #064e3b 100%
                  );
                  background-size: 200% 200%;
                  animation: gradientShift 4s ease-in-out infinite;
                  border-radius: 14px;
                  position: relative;
                  overflow: hidden;
                }
                
                .yield-card-bg::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    45deg,
                    rgba(16, 185, 129, 0.1) 0%,
                    rgba(52, 211, 153, 0.2) 25%,
                    rgba(110, 231, 183, 0.1) 50%,
                    rgba(167, 243, 208, 0.2) 75%,
                    rgba(16, 185, 129, 0.1) 100%
                  );
                  background-size: 400% 400%;
                  animation: shimmer 3s ease-in-out infinite;
                  z-index: 1;
                }
                
                .yield-card-bg > div {
                  position: relative;
                  z-index: 2;
                }
                
                @keyframes gradientShift {
                  0%, 100% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                }
                
                @keyframes shimmer {
                  0%, 100% {
                    background-position: 0% 0%;
                    opacity: 0.3;
                  }
                  50% {
                    background-position: 100% 100%;
                    opacity: 0.6;
                  }
                }
              `}</style>
            </motion.div>
          )}

          {/* Loading state - initial load */}
          {isLoading && (
            <TransactionsSkeleton count={10} />
          )}

          {/* No yield transactions */}
          {!isLoading && yieldTransactions.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-foreground mb-2">No Yield Earned Yet</h3>
              <p className="text-muted-foreground">Your yield earnings will appear here as your investments grow.</p>
            </div>
          )}

          {/* Yield Transactions List */}
          {!isLoading && yieldTransactions.length > 0 && (
            <div className="space-y-3">
              {(() => {
                let lastDate = '';
                const elements: React.JSX.Element[] = [];
                
                yieldTransactions.forEach((tx, index) => {
                  const txDate = new Date(tx.timestamp * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  // Add date separator if this is a new date
                  if (txDate !== lastDate) {
                    elements.push(
                      <div key={`date-${txDate}-${index}`} className="flex items-center my-6">
                        <div className="flex-1 h-px bg-border"></div>
                        <div className="px-4 text-sm font-medium text-muted-foreground bg-background">
                          {txDate}
                        </div>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                    );
                    lastDate = txDate;
                  }
                  
                  // Add the transaction
                  elements.push(
                    <Link
                      key={`${tx.id || tx.hash}-${index}`}
                      href={`/transaction/${tx.hash}`}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index > 10 ? 0 : index * 0.05 }}
                        className="bg-card border border-border rounded-xl p-4 hover:border-green-400 transition-all duration-200 hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                              <span className="text-green-500 text-lg font-bold">+</span>
                            </div>
                            <div>
                              <h4 className="text-base font-medium text-foreground">Yield Earned</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(tx.timestamp * 1000).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-green-500">
                              +{tx.amount.toFixed(6)} {tx.token}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{getVaultNameByAddress(tx.fromAddress || '')}</p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                });
                
                return elements;
              })()}

              {/* Load More Button - use hasMoreYield instead of hasMore */}
              {hasMoreYield && (
                <div className="text-center pt-3 pb-20">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                        Loading more...
                      </div>
                    ) : (
                      'Load More Yield'
                    )}
                  </button>
                </div>
              )}

              {/* Loading more state */}
              {isLoadingMore && (
                <div className="mt-4">
                  <TransactionsSkeleton count={5} />
                </div>
              )}

              {/* End of list indicator - use !hasMoreYield instead of !hasMore */}
              {!hasMoreYield && yieldTransactions.length > 0 && (
                <div className="text-center pt-6 pb-20">
                  <p className="text-sm text-muted-foreground">
                    You've viewed all your yield earnings
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.main>
    </AnimatePresence>
  );
}