"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Filter, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteTransactions, useMultiChainSmartWallet } from "../lib/hooks";
import { TransactionsSkeleton } from "../components/ui/skeletons";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

type TokenFilter = 'all' | 'USDC' | 'USDT' | 'ETH';
type DateFilter = 'all' | '7d' | '30d' | '90d';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const tokenOptions: DropdownOption[] = [
  {
    value: 'all',
    label: 'All Tokens',
  },
  {
    value: 'USDC',
    label: 'USDC',
    icon: (
      <div className="w-4 h-4">
        <Avatar className="w-4 h-4">
          <AvatarImage src="/token/usdc.png" alt="USDC" />
          <AvatarFallback className="text-[8px] bg-blue-500 text-white">$</AvatarFallback>
        </Avatar>
      </div>
    )
  },
  {
    value: 'USDT',
    label: 'USDT',
    icon: (
      <div className="w-4 h-4">
        <Avatar className="w-4 h-4">
          <AvatarImage src="/token/usdt.png" alt="USDT" />
          <AvatarFallback className="text-[8px] bg-green-500 text-white">₮</AvatarFallback>
        </Avatar>
      </div>
    )
  },
  {
    value: 'ETH',
    label: 'ETH',
    icon: (
      <div className="w-4 h-4">
        <Avatar className="w-4 h-4">
          <AvatarImage src="/token/eth.png" alt="ETH" />
          <AvatarFallback className="text-[8px] bg-gray-800 text-white">Ξ</AvatarFallback>
        </Avatar>
      </div>
    )
  },
];

const dateOptions: DropdownOption[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
}

function CustomDropdown({ value, onChange, options, placeholder, icon }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span className="text-sm font-medium">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[150]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-lg z-[200] overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${value === option.value ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const walletAddress = multiChainWalletData?.smartAccountAddress;

  const {
    transactions: allTransactions,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore
  } = useInfiniteTransactions(walletAddress || '', 20);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];

    let filtered = allTransactions;

    // Apply token filter
    if (tokenFilter !== 'all') {
      filtered = filtered.filter(tx => tx.token === tokenFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const filterDate = new Date();

      switch (dateFilter) {
        case '7d':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(filterDate.getDate() - 30);
          break;
        case '90d':
          filterDate.setDate(filterDate.getDate() - 90);
          break;
      }

      filtered = filtered.filter(tx => tx.timestamp * 1000 >= filterDate.getTime());
    }

    return filtered;
  }, [allTransactions, tokenFilter, dateFilter]);

  const resetFilters = () => {
    setTokenFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = tokenFilter !== 'all' || dateFilter !== 'all';

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
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border fixed top-0 w-full bg-background z-10">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </button>
            <h1 className="text-xl font-bold text-primary">Transaction History</h1>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors relative ${hasActiveFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
              }`}
          >
            <Filter className="w-5 h-5" />
            {hasActiveFilters && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-b border-border bg-card mt-16 overflow-visible fixed top-0 w-full z-[50]"
            >
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Token Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Token:</span>
                    <CustomDropdown
                      value={tokenFilter}
                      onChange={(value) => setTokenFilter(value as TokenFilter)}
                      options={tokenOptions}
                    />
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Period:</span>
                    <CustomDropdown
                      value={dateFilter}
                      onChange={(value) => setDateFilter(value as DateFilter)}
                      options={dateOptions}
                    />
                  </div>

                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing:</span>
                    {tokenFilter !== 'all' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                        {tokenOptions.find(opt => opt.value === tokenFilter)?.icon}
                        {tokenFilter}
                      </span>
                    )}
                    {dateFilter !== 'all' && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                        {dateOptions.find(opt => opt.value === dateFilter)?.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className={`flex-1 px-6 py-6 ${showFilters ? 'mt-40' : 'mt-16'} transition-all duration-300`}>
          {/* Loading state - initial load */}
          {isLoading && (
            <TransactionsSkeleton count={10} />
          )}

          {/* No transactions */}
          {!isLoading && (!allTransactions || allTransactions.length === 0) && (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-foreground mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">Your transaction history will appear here once you start using vaults.</p>
            </div>
          )}

          {/* No transactions after filtering */}
          {!isLoading && allTransactions && allTransactions.length > 0 && filteredTransactions.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                No transactions match your current filters.
                {hasMore && " Try loading more transactions or adjusting your filters."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Transactions'}
                  </button>
                )}
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Transactions List */}
          {!isLoading && filteredTransactions && filteredTransactions.length > 0 && (
            <div className={`space-y-3 ${hasActiveFilters ? 'mt-20' : ''} transition-all duration-300`}>
              {(() => {
                let lastDate = '';
                const elements: React.JSX.Element[] = [];

                filteredTransactions.forEach((tx, index) => {
                  const txDate = new Date(tx.timestamp * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  // Add date separator if this is a new date
                  if (txDate !== lastDate) {
                    elements.push(
                      <div key={`date-${txDate}`} className="flex items-center my-6">
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
                      key={tx.id}
                      href={`/transaction/${tx.hash}`}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index > 10 ? 0 : index * 0.05 }}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all duration-200 hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-gray-100' :
                                tx.type === 'accrue' ? 'bg-green-100' :
                                  tx.type === 'transfer-in' ? 'bg-green-100' :
                                    tx.type === 'withdraw' ? 'bg-gray-100' :
                                      'bg-gray-100'
                              }`}>
                              {tx.type === 'deposit' && <span className="text-black text-lg font-bold">+</span>}
                              {tx.type === 'accrue' && <span className="text-green-500 text-lg font-bold">+</span>}
                              {tx.type === 'withdraw' && <span className="text-black text-lg font-bold">-</span>}
                              {tx.type === 'transfer-in' && (
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                  <path d="M5 5L15 15" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                                  <path d="M15 8V15H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              )}
                              {tx.type === 'transfer-out' && (
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                  <path d="M5 15L15 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                                  <path d="M12 5H15V8" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              )}
                              {tx.type === 'swap' && (
                                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                )}
                            </div>
                            <div>
                              <h4 className="text-base font-medium text-foreground capitalize">
                                {tx.type === 'accrue' ? 'Yield Earned' :
                                  tx.type === 'transfer-in' ? 'Received' :
                                    tx.type === 'transfer-out' ? 'Sent' : 
                                    tx.type === 'swap' ? 'Swap' : tx.type}
                              </h4>
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
                            <p className={`text-base font-semibold ${tx.type === 'deposit' ? 'text-black' :
                                tx.type === 'accrue' ? 'text-green-500' :
                                  tx.type === 'transfer-in' ? 'text-green-500' :
                                    tx.type === 'withdraw' ? 'text-black' : 'text-black'
                              }`}>
                              {tx.type === 'transfer-out' ? '-' : tx.type === 'transfer-in' ? '+' : ''}
                              {tx.type === 'accrue' ? '+' + tx.amount.toFixed(2) : tx.amount.toFixed(2)} {tx.token}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                });

                return elements;
              })()}

              {/* Load More Button - always show if there are more transactions */}
              {hasMore && (
                <div className="text-center pt-3 pb-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                        Loading...
                      </div>
                    ) : (
                      'Load More'
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

              {/* End indicator with smart messaging */}
              {!hasMore && (
                <div className="text-center pt-6 pb-20">
                  {hasActiveFilters ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredTransactions.length} filtered transaction{filteredTransactions.length !== 1 ? 's' : ''} from {allTransactions?.length || 0} total
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All transactions have been loaded
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You've reached the end of your transaction history
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.main>
    </AnimatePresence>
  );
}