"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { QueryKeys } from "../hooks";
import { vaultAPI } from "../api/vault-api";

interface GlobalRefreshContextType {
  isRefreshing: boolean;
  refreshHomePage: () => Promise<void>;
  refreshPortfolioPage: () => Promise<void>;
  refreshMarketPage: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshVaults: () => Promise<void>;
  refreshSmart: () => Promise<void>;
  refreshWalletBalancesOnly: () => Promise<void>;
}

const GlobalRefreshContext = createContext<GlobalRefreshContextType | undefined>(undefined);

export function GlobalRefreshProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Page-specific refresh functions
  const refreshHomePage = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        // Home page: total assets and transactions
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.totalAssets] 
        }),
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.smartWallet, 'balances'] 
        }),
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.transactions] 
        }),
      ]);
      
      console.log("✅ Home page refresh completed - vault page automatically updated via shared useTotalAssets");
    } catch (error) {
      console.error("❌ Home page refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshPortfolioPage = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      console.log("🔄 Portfolio refresh (fully optimized - no sequential getUserData calls)...");
      
      await Promise.all([
        // Total assets - uses getParallelBalances internally (no sequential getUserData calls)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets] 
        }),
        // Vault positions (for portfolio display)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.vaultPositions] 
        }),
        // Multi-chain token balances (for withdraw page)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.smartWallet, "balances"] 
        }),
      ]);
      
      console.log("✅ Portfolio refresh completed (fully optimized - parallel API calls only)");
    } catch (error) {
      console.error("❌ Portfolio refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshMarketPage = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Clear vault API cache for fresh data
      vaultAPI.clearCache();
      
      // Market page: vaults data AND user data (for vault positions and buy drawer balance)
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.user] 
        }),
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.vaults] 
        }),
        queryClient.refetchQueries({ 
          queryKey: [QueryKeys.vaultPositions, 'individual'] 
        }),
        // Add minimum refresh time to make it visible
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      console.log("✅ Market page refresh completed - user data and vault positions updated");
    } catch (error) {
      console.error("❌ Market page refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // General refresh functions
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Clear vault API cache for fresh data
      vaultAPI.clearCache();
      
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.user]
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.smartWallet] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets] 
        }),
        // Asset history (for chart)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets, "history"] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.vaults] 
        }),
      ]);
      
      console.log("✅ Global refresh completed");
    } catch (error) {
      console.error("❌ Global refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshUserData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.user] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.smartWallet] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets] 
        }),
        // Asset history (for chart)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets, "history"] 
        }),
      ]);
      
      console.log("✅ User data refresh completed");
    } catch (error) {
      console.error("❌ User data refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshTransactions = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all transaction queries (both old and optimized)
      await queryClient.invalidateQueries({ 
        queryKey: [QueryKeys.transactions] 
      });
      
      console.log("✅ Transactions refresh completed");
    } catch (error) {
      console.error("❌ Transactions refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshVaults = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Clear vault API cache for fresh data
      vaultAPI.clearCache();
      
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.vaults] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.vaultPositions] 
        }),
        // Only invalidate user data if vault positions might have changed
        // queryClient.invalidateQueries({ 
        //   queryKey: [QueryKeys.user] 
        // }),
      ]);
      
      console.log("✅ Vaults refresh completed");
    } catch (error) {
      console.error("❌ Vaults refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshSmart = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        // Smart refresh only for essential data
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets] 
        }),
        // Invalidate vault balance for accurate total assets
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets, 'vaultBalance'] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.smartWallet, 'balances'] 
        }),
      ]);
      
      console.log("✅ Smart refresh completed");
    } catch (error) {
      console.error("❌ Smart refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const refreshWalletBalancesOnly = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      console.log("🔄 Refreshing wallet balances only (no vault data)...");
      
      await Promise.all([
        // Only refresh user wallet balances (ETH, USDT, USDC across all chains)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.user] 
        }),
        // Smart wallet balance data - but NOT the address (to avoid triggering vault queries)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.smartWallet, 'balances'] 
        }),
        // Only the wallet balance portion of total assets (not vault balance)
        queryClient.invalidateQueries({ 
          queryKey: [QueryKeys.totalAssets, 'walletBalance'] 
        }),
      ]);
      
      console.log("✅ Wallet balances only refresh completed - no vault data touched");
    } catch (error) {
      console.error("❌ Wallet balances only refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const value = {
    isRefreshing,
    refreshHomePage,
    refreshPortfolioPage,
    refreshMarketPage,
    refreshAll,
    refreshUserData,
    refreshTransactions,
    refreshVaults,
    refreshSmart,
    refreshWalletBalancesOnly,
  };

  return (
    <GlobalRefreshContext.Provider value={value}>
      {children}
    </GlobalRefreshContext.Provider>
  );
}

export function useGlobalRefresh() {
  const context = useContext(GlobalRefreshContext);
  if (context === undefined) {
    throw new Error('useGlobalRefresh must be used within a GlobalRefreshProvider');
  }
  return context;
} 