"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { api } from "./api";
import { walletAPI } from "./api/wallet-api";
import { userAPI } from "./api/user-api";
import { vaultAPI } from "./api/vault-api";
import { transactionAPI } from "./api/transaction-api";
import { trackerAPI } from "./api/tracker-api";
import { priceAPI } from "./api/price-api";
import { UserData, Transaction } from "./types";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { rewardAPI } from "./api/reward-api";
import { odosAPI } from "./api/odos-api";
import { SupportedChainKey } from "./config/chains";
import { getVaultProtocolBalances } from "./utils/chain-utils";
import { VaultConfig } from "./config/vaults";
import { JsonRpcProvider } from "ethers";

// Query keys
export const QueryKeys = {
  user: "user",
  wallet: "wallet",
  smartWallet: "smartWallet",
  transactions: "transactions",
  vaults: "vaults",
  vault: (id: string) => ["vault", id],
  vaultPositions: "vaultPositions",
  vaultPosition: (id: string) => ["vaultPosition", id],
  totalAssets: "totalAssets",
  username: (address: string) => ["username", address],
  onboardingStatus: (address: string) => ["onboardingStatus", address],
  rewards: "rewards",
};

// User hooks
export function useUserData() {
  const { user: privyUser, authenticated, ready, getAccessToken } = usePrivy();
  const { data: multiChainWalletData, isLoading: isWalletLoading } =
    useMultiChainSmartWallet();

  return useQuery({
    queryKey: [QueryKeys.user, privyUser?.id, multiChainWalletData],
    queryFn: async (): Promise<UserData> => {
      if (!authenticated || !privyUser) {
        throw new Error("User not authenticated");
      }

      return await userAPI.getUserData(privyUser, multiChainWalletData, async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available');
        return token;
      });
    },
    enabled:
      ready &&
      authenticated &&
      !!privyUser &&
      !!multiChainWalletData &&
      !isWalletLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes - user data doesn't change frequently
    refetchOnWindowFocus: (query) => {
      // Only refetch if data is older than 1 minute
      return Date.now() - (query.state.dataUpdatedAt || 0) > 60 * 1000;
    },
    retry: 2,
  });
}

// Hook to get default display name
export function useDefaultDisplayName() {
  const { user: privyUser } = usePrivy();

  return useMemo(() => {
    if (!privyUser) return "User";
    return userAPI.getDefaultDisplayName(privyUser);
  }, [privyUser]);
}

// Hook to get additional user info (email or wallet info)
export function useAdditionalUserInfo() {
  const { user: privyUser } = usePrivy();
  const { wallets } = useWallets();

  return useMemo(() => {
    if (!privyUser || !wallets.length) return null;
    return userAPI.getAdditionalUserInfo(privyUser, wallets);
  }, [privyUser, wallets]);
}

// Multi-chain Smart Wallet hooks
export function useMultiChainSmartWallet(isLoggingOut: boolean = false) {
  const { authenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Always use embedded wallet only - filter out injected wallets
  const embeddedWallet = wallets.find(
    (w) => w.connectorType === "embedded" && w.walletClientType === "privy"
  );
  const currentWalletAddress = embeddedWallet?.address || null;

  return useQuery({
    queryKey: [QueryKeys.smartWallet, "summary", currentWalletAddress],
    queryFn: async () => {
      if (!authenticated || !embeddedWallet) {
        throw new Error("No embedded wallet available");
      }

      return await walletAPI.initializeSmartAccount(embeddedWallet);
    },
    enabled:
      ready &&
      walletsReady &&
      authenticated &&
      !!embeddedWallet &&
      !isLoggingOut,
    staleTime: Infinity,
    retry: 1,
  });
}

// Add hook to get multi-chain token balances
export function useMultiChainTokenBalances(tokenSymbol: string) {
  const { data: multiChainWalletData, isLoading: isWalletLoading } =
    useMultiChainSmartWallet();

  return useQuery({
    queryKey: [
      QueryKeys.smartWallet,
      "balances",
      tokenSymbol,
      multiChainWalletData?.embeddedWalletAddress,
    ],
    queryFn: () => walletAPI.getMultiChainTokenBalances(tokenSymbol),
    enabled: !!tokenSymbol && !!multiChainWalletData && !isWalletLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes - balances don't change that frequently
    refetchOnWindowFocus: (query) => {
      // Only refetch if data is older than 1 minute
      return Date.now() - (query.state.dataUpdatedAt || 0) > 60 * 1000;
    },
  });
}

// hook to deploy smart account
export function useDeploySmartAccount() {
  const queryClient = useQueryClient();
  const { wallets } = useWallets();

  // Always use embedded wallet only
  const embeddedWallet = wallets.find(
    (w) => w.connectorType === "embedded" && w.walletClientType === "privy"
  );
  const currentWalletAddress = embeddedWallet?.address || null;

  return useMutation({
    mutationFn: () => walletAPI.deploySmartAccount(),
    onSuccess: (deployed) => {
      if (deployed) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.smartWallet, "summary", currentWalletAddress],
        });
      }
    },
  });
}

// OPTIMIZED: Direct loading for total assets - show loading skeleton until real data is ready
export const useTotalAssetsProgressive = () => {
  const { data: walletData } = useMultiChainSmartWallet();
  const { getAccessToken } = usePrivy();
  const walletAddress = walletData?.smartAccountAddress;

  // Single query: Get real data directly (no cached data)
  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.totalAssets, walletAddress],
    queryFn: async () => {
      if (!walletAddress || !walletData)
        return { total: 0, walletBalance: 0, vaultBalance: 0 };

      try {
        // Set up authentication for priceAPI
        priceAPI.setAccessTokenGetter(async () => {
          const token = await getAccessToken();
          if (!token) throw new Error('No access token available');
          return token;
        });

        // Use the new parallel balance fetching method
        const [freshBalances, prices, vaultBalance] = await Promise.all([
          userAPI.getParallelBalances(walletAddress),
          priceAPI.getPrices(["ETH/USD", "USDT/USD"]),
          userAPI.getAggregatedVaultBalanceForScroll(walletAddress),
        ]);

        // Calculate individual USD values for breakdown
        const usdcUSD = freshBalances.usdcBalance; // USDC is already in USD
        const ethUSD = freshBalances.ethBalance * prices["ETH/USD"];
        const usdtUSD = freshBalances.usdtBalance * prices["USDT/USD"];

        // Calculate fresh wallet balance
        const walletBalance = usdcUSD + ethUSD + usdtUSD;

        const vaultBalanceNum = parseFloat(
          vaultBalance.totalWithdrawableUsdc || "0"
        );

        return {
          total: walletBalance + vaultBalanceNum,
          walletBalance,
          vaultBalance: vaultBalanceNum,
          // Add breakdown for individual tokens in USD
          breakdown: {
            usdcUSD,
            ethUSD,
            usdtUSD,
            // Also include raw token amounts
            usdcAmount: freshBalances.usdcBalance,
            ethAmount: freshBalances.ethBalance,
            usdtAmount: freshBalances.usdtBalance,
          },
          isFromCache: false,
        };
      } catch (error) {
        console.error("Error fetching total assets:", error);
        throw error;
      }
    },
    enabled: !!walletAddress && !!walletData,
    staleTime: 2 * 60 * 1000, // Fresh data stays fresh for 2 minutes
    refetchOnWindowFocus: (query) => {
      // Only refetch if data is older than 1 minute
      return Date.now() - (query.state.dataUpdatedAt || 0) > 60 * 1000;
    },
  });

  return {
    data,
    isLoading,
    isUpdating: false, // No progressive loading anymore
    error,
    isFromCache: false,
  };
};

// BACKWARD COMPATIBILITY: Original useTotalAssets hook using the new progressive approach
export function useTotalAssets() {
  const { data: userData, isLoading: userLoading } = useUserData();
  const { data: walletData, isLoading: walletLoading } =
    useMultiChainSmartWallet();
  const { ready } = usePrivy();
  const { ready: walletsReady } = useWallets();

  // Use the new progressive hook internally
  const {
    data: progressiveData,
    isLoading: progressiveLoading,
    error,
  } = useTotalAssetsProgressive();

  // Extract values in the format expected by existing components
  const totalAssets = progressiveData?.total || 0;
  const walletBalance = progressiveData?.walletBalance || 0;
  const vaultBalance = progressiveData?.vaultBalance || 0;
  const walletBreakdown = progressiveData?.breakdown || null;

  const isLoading =
    !ready ||
    !walletsReady ||
    walletLoading ||
    userLoading ||
    progressiveLoading ||
    !walletData;

  return {
    totalAssets,
    walletBalance,
    vaultBalance,
    walletBreakdown,
    isLoading,
    error,
  };
}

// Hook to get asset history for charts
export function useAssetHistory() {
  const { data: multiChainWalletData, isLoading: isWalletLoading } =
    useMultiChainSmartWallet();
  const { getAccessToken } = usePrivy();
  const walletAddress = multiChainWalletData?.smartAccountAddress;

  return useQuery({
    queryKey: [QueryKeys.totalAssets, "history", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error("No wallet address available");
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }

      const url = `/api/users/${walletAddress}/asset-history?interval=day`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Asset history API request failed: ${response.status}`);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      return data;
    },
    enabled: !!walletAddress && !isWalletLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - asset history changes slowly
    refetchOnWindowFocus: "always", // Only refetch if stale
    retry: 2,
  });
}

// Hook to withdraw tokens to an EOA
export function useWithdrawToEOA() {
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      amount,
      token,
      recipientAddress,
    }: {
      amount: string;
      token: string;
      recipientAddress: `0x${string}`;
    }) => {
      if (!multiChainWalletData) {
        throw new Error("Multi-chain wallet data not available");
      }

      // Get the raw multi-chain data from walletAPI
      const rawMultiChainData = walletAPI.getMultiChainWalletData();

      return transactionAPI.withdrawToEOA(
        token,
        amount,
        recipientAddress,
        rawMultiChainData
      );
    },
    onSuccess: async () => {
      // FORCE immediate refetch of total assets (used by both home page and vault page)
      await queryClient.refetchQueries({ queryKey: [QueryKeys.totalAssets] });

      // FORCE immediate refetch of multi-chain token balances (for withdraw page)
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.smartWallet, "balances"],
      });

      // Invalidate transaction queries to show new withdrawal
      queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });

      // Also invalidate the optimized transaction hook
      const walletAddress = multiChainWalletData?.smartAccountAddress;
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.transactions, walletAddress],
        });
      }

      console.log(
        "✅ EOA withdrawal completed - home page and vault page updated via shared useTotalAssets"
      );
    },
  });
}

// Hook to refresh wallet balances manually (for pull-to-refresh or manual refresh)
export function useRefreshWalletBalances() {
  const queryClient = useQueryClient();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const walletAddress = multiChainWalletData?.smartAccountAddress;

  return () => {
    if (!walletAddress) return;

    // OPTIMIZED: Only invalidate user data and wallet balance subquery (not vault balance)
    queryClient.invalidateQueries({ queryKey: [QueryKeys.user] });
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.smartWallet, "balances"],
    });
    // Only invalidate the wallet balance subquery, not all total assets
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.totalAssets, "walletBalance"],
    });

    console.log(
      "🔄 Refreshing wallet balances - targeting wallet queries only (no vault data)..."
    );
  };
}

// Hook to clear wallet cache (call this on logout)
export function useClearWalletCache() {
  const queryClient = useQueryClient();

  return () => {
    // Clear React Query cache for all smart wallet queries
    queryClient.removeQueries({ queryKey: [QueryKeys.smartWallet] });
    // Clear WalletAPI cache
    walletAPI.clearWalletData();
  };
}

export function formatAddress(address: string | null): string {
  if (!address) return "";
  return `${address.substring(0, 8)}...${address.substring(
    address.length - 8
  )}`;
}

// Hook to register username with tracker API
export function useRegisterUsername() {
  const queryClient = useQueryClient();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const { getAccessToken } = usePrivy();

  return useMutation({
    mutationFn: async ({
      username,
      referralCode,
    }: {
      username: string;
      referralCode?: string;
    }) => {
      if (!multiChainWalletData?.smartAccountAddress) {
        throw new Error("No smart account address available");
      }

      // Set up authentication for trackerAPI
      trackerAPI.setAccessTokenGetter(async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available');
        return token;
      });

      // Validate referral code if provided
      if (referralCode) {
        const isValid = await userAPI.validateReferralCode(referralCode, async () => {
          const token = await getAccessToken();
          if (!token) {
            throw new Error("No access token available");
          }
          return token;
        });
        if (!isValid) {
          throw new Error("Invalid referral code: Code does not exist");
        }
      }
      await trackerAPI.registerUser(
        multiChainWalletData.smartAccountAddress,
        username,
        referralCode
      );
      return true;
    },
    onSuccess: async () => {
      const smartAccountAddress = multiChainWalletData?.smartAccountAddress;
      if (smartAccountAddress) {
        // Invalidate and refetch all relevant queries
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: QueryKeys.username(smartAccountAddress),
          }),
          queryClient.invalidateQueries({
            queryKey: QueryKeys.onboardingStatus(smartAccountAddress),
          }),
          queryClient.invalidateQueries({
            queryKey: [QueryKeys.user],
          }),
        ]);

        // Force refetch the onboarding status to ensure it's updated
        await queryClient.refetchQueries({
          queryKey: QueryKeys.onboardingStatus(smartAccountAddress),
          exact: true,
        });
      }
    },
  });
}

// Hook to check onboarding status based on whether user has a username
export function useOnboardingStatus() {
  const { user: privyUser, getAccessToken } = usePrivy();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  const smartAccountAddress = multiChainWalletData?.smartAccountAddress || null;

  return useQuery({
    queryKey: QueryKeys.onboardingStatus(smartAccountAddress || ""),
    queryFn: async () => {
      if (!smartAccountAddress) return false;
      
      // Set up authentication for trackerAPI
      trackerAPI.setAccessTokenGetter(async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available');
        return token;
      });
      
      const result = await trackerAPI.checkUserExists(smartAccountAddress);
      return result;
    },
    enabled: !!smartAccountAddress,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Hook to get username with caching
export function useUsername() {
  const { user: privyUser, getAccessToken } = usePrivy();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  const smartAccountAddress = multiChainWalletData?.smartAccountAddress || null;

  return useQuery({
    queryKey: QueryKeys.username(smartAccountAddress || ""),
    queryFn: async () => {
      if (!smartAccountAddress) return null;
      
      // Set up authentication for trackerAPI
      trackerAPI.setAccessTokenGetter(async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available');
        return token;
      });
      
      return await trackerAPI.getUsernameByWallet(smartAccountAddress);
    },
    enabled: !!smartAccountAddress,
    staleTime: 300000, // Cache for 5 minutes
  });
}

// Hook to deposit to specific vault using transaction-api
export function useDepositToVault() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  return useMutation({
    mutationFn: async ({
      vaultId,
      amount,
    }: {
      vaultId: string;
      amount: string;
    }) => {
      if (!multiChainWalletData) {
        throw new Error("Multi-chain wallet data not available");
      }

      // Get the raw multi-chain data from walletAPI
      const rawMultiChainData = walletAPI.getMultiChainWalletData();

      return transactionAPI.depositToVault(vaultId, amount, rawMultiChainData);
    },
    onSuccess: async (result, variables) => {
      // Clear vault API cache to ensure fresh data
      vaultAPI.clearCache();

      // FORCE immediate refetch of total assets (bypasses staleTime)
      await queryClient.refetchQueries({ queryKey: [QueryKeys.totalAssets] });

      // FORCE immediate refetch of multi-chain token balances (for withdraw page)
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.smartWallet, "balances"],
      });

      // Invalidate vault-specific queries to update total deposits
      queryClient.invalidateQueries({ queryKey: [QueryKeys.vaults] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.vaultPositions] });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.vaultPosition(variables.vaultId),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.vault(variables.vaultId),
      });

      // Invalidate individual vault balances for market page
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.vaultPositions, "individual"],
      });

      // Invalidate transactions to show new deposit transaction
      queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });

      // Also invalidate the optimized transaction hook
      const walletAddress = multiChainWalletData?.smartAccountAddress;
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.transactions, walletAddress],
        });
      }

      console.log(
        `✅ Vault deposit completed - balances refetched immediately. CrossChain: ${result.crossChain}`
      );

      // Navigate back to markets page after successful deposit
      router.push("/market");
    },
  });
}

export function useWithdrawFromVault() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  return useMutation({
    mutationFn: async ({
      vaultId,
      amount,
    }: {
      vaultId: string;
      amount: number;
    }) => {
      if (!multiChainWalletData) {
        throw new Error("Multi-chain wallet data not available");
      }

      // Get the raw multi-chain data from walletAPI
      const rawMultiChainData = walletAPI.getMultiChainWalletData();

      return transactionAPI.withdrawFromVault(
        vaultId,
        amount.toString(),
        rawMultiChainData
      );
    },
    onSuccess: async (result, variables) => {
      // Clear vault API cache to ensure fresh data
      vaultAPI.clearCache();

      // FORCE immediate refetch of total assets (bypasses staleTime)
      await queryClient.refetchQueries({ queryKey: [QueryKeys.totalAssets] });

      // FORCE immediate refetch of multi-chain token balances (for withdraw page)
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.smartWallet, "balances"],
      });

      // Invalidate vault-specific queries to update total deposits
      queryClient.invalidateQueries({ queryKey: [QueryKeys.vaults] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.vaultPositions] });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.vaultPosition(variables.vaultId),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.vault(variables.vaultId),
      });

      // Invalidate individual vault balances for market page
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.vaultPositions, "individual"],
      });

      // Invalidate transactions to show new withdrawal transaction
      queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });

      // Also invalidate the optimized transaction hook
      const walletAddress = multiChainWalletData?.smartAccountAddress;
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.transactions, walletAddress],
        });
      }

      console.log(
        `✅ Vault withdrawal completed - balances refetched immediately`
      );

      // Navigate back to markets page after successful withdrawal
      router.replace("/market");
    },
  });
}

// Transaction hooks with infinite loading support
export function useInfiniteTransactions(
  walletAddress: string,
  pageSize: number = 20
) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryClient = useQueryClient();

  // Query for the current page
  const {
    data: pageTransactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QueryKeys.transactions, walletAddress, currentPage, pageSize],
    queryFn: () =>
      transactionAPI.getTransactions(walletAddress, currentPage, pageSize),
    enabled: !!walletAddress && hasMore,
    staleTime: 30000,
  });

  // Update allTransactions when new page data arrives
  useEffect(() => {
    if (pageTransactions) {
      if (currentPage === 1) {
        // Reset for first page
        setAllTransactions(pageTransactions);
        // If first page has fewer than pageSize, we know there's no more
        setHasMore(pageTransactions.length === pageSize);
      } else {
        // Append for subsequent pages with deduplication
        setAllTransactions((prev) => {
          // Create a Set of existing transaction IDs for fast lookup
          const existingIds = new Set(prev.map((tx) => tx.id || tx.hash));

          // Filter out any duplicates from the new page
          const newTransactions = pageTransactions.filter(
            (tx) => !existingIds.has(tx.id || tx.hash)
          );

          // Set hasMore based on whether we got new unique transactions
          // and whether the API returned a full page
          const gotFullPage = pageTransactions.length === pageSize;
          const gotNewTransactions = newTransactions.length > 0;

          // We have more data only if we got a full page AND we got new transactions
          setHasMore(gotFullPage && gotNewTransactions);

          return [...prev, ...newTransactions];
        });
      }

      setIsLoadingMore(false);
    }
  }, [pageTransactions, currentPage, pageSize]);

  // Cache the combined transactions for easy access by other hooks
  useEffect(() => {
    if (allTransactions.length > 0) {
      queryClient.setQueryData(
        [QueryKeys.transactions, "combined", walletAddress],
        allTransactions
      );
    }
  }, [allTransactions, walletAddress, queryClient]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore, isLoading]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    setAllTransactions([]);
    // Clear the combined cache when refreshing
    queryClient.removeQueries({
      queryKey: [QueryKeys.transactions, "combined", walletAddress],
    });
  }, [queryClient, walletAddress]);

  return {
    transactions: allTransactions,
    isLoading: isLoading && currentPage === 1, // Only show loading for initial load
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    error,
  };
}

// Hook to get individual vault balances (lightweight alternative to full user data)
export function useIndividualVaultBalances() {
  const { data: walletData, isLoading: walletLoading } =
    useMultiChainSmartWallet();
  const walletAddress = walletData?.smartAccountAddress;

  return useQuery({
    queryKey: [QueryKeys.vaultPositions, "individual", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      try {
        // Use the lightweight vault balance method
        const vaultData = await userAPI.getAggregatedVaultBalanceForScroll(
          walletAddress
        );

        // Extract individual vault balances if available
        const individualBalances: { [vaultId: string]: string } = {};

        // Map the vault data to individual balances
        // The API returns virtualVault and combinedVault data, both belong to the stable yield vault
        if (
          vaultData.virtualVault?.withdrawableUsdc ||
          vaultData.combinedVault?.withdrawableUsdc
        ) {
          const virtualVaultBalance = parseFloat(
            vaultData.virtualVault?.withdrawableUsdc || "0"
          );
          const combinedVaultBalance = parseFloat(
            vaultData.combinedVault?.withdrawableUsdc || "0"
          );
          const totalStableYieldBalance =
            virtualVaultBalance + combinedVaultBalance;

          // Map to the correct vault ID from the vault data
          individualBalances["stableyield"] =
            totalStableYieldBalance.toString();
        }

        return individualBalances;
      } catch (error) {
        console.error("Failed to fetch individual vault balances:", error);
        return {};
      }
    },
    enabled: !!walletAddress && !!walletData && !walletLoading,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes - vault balances change slowly
    refetchOnWindowFocus: "always", // Only refetch if stale
  });
}

// Vault hooks
export function useVaults() {
  const { getAccessToken } = usePrivy();
  
  return useQuery({
    queryKey: [QueryKeys.vaults],
    queryFn: () => vaultAPI.getVaults(async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');
      return token;
    }),
    staleTime: 0, // Always fetch fresh data
    gcTime: 30000, // Keep in cache for 30 seconds
  });
}

export function useVault(id: string) {
  const { getAccessToken } = usePrivy();
  
  return useQuery({
    queryKey: QueryKeys.vault(id),
    queryFn: () => vaultAPI.getVaultById(id, async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');
      return token;
    }),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data
    gcTime: 30000, // Keep in cache for 30 seconds
    retry: 2,
  });
}

// Hook to get average APY for a specific vault
export function useVaultAverageApy(vaultId: string) {
  return useQuery({
    queryKey: [QueryKeys.vault(vaultId), "apy"],
    queryFn: () => vaultAPI.getAverageApy(vaultId),
    enabled: !!vaultId,
    staleTime: 300000, // Cache for 5 minutes
    retry: 2,
  });
}

// ODOS Hooks

// Hook to get swap quote
export function useSwapQuote(
  chainKey: SupportedChainKey,
  inputToken: string,
  outputToken: string,
  amount: string,
  enabled: boolean = true
) {
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const userAddress = multiChainWalletData?.smartAccountAddress;

  return useQuery({
    queryKey: [
      "swapQuote",
      chainKey,
      inputToken,
      outputToken,
      amount,
      userAddress,
    ],
    queryFn: () => {
      if (!userAddress || !amount || parseFloat(amount) <= 0) {
        throw new Error("Invalid parameters for swap quote");
      }

      return transactionAPI.getSwapQuote(
        chainKey,
        inputToken,
        outputToken,
        amount,
        userAddress
      );
    },
    enabled:
      enabled &&
      !!userAddress &&
      !!amount &&
      parseFloat(amount) > 0 &&
      inputToken !== outputToken &&
      odosAPI.isSupportedSwap(inputToken, outputToken, chainKey),
    staleTime: 10000, // 10 seconds - quotes change frequently
    refetchOnWindowFocus: false, // Don't refetch on focus for quotes
    retry: 2,
  });
}

// Hook to execute swap
export function useExecuteSwap() {
  const queryClient = useQueryClient();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  return useMutation({
    mutationFn: async ({
      chainKey,
      inputToken,
      outputToken,
      amount,
      slippage = 0.5,
    }: {
      chainKey: SupportedChainKey;
      inputToken: string;
      outputToken: string;
      amount: string;
      slippage?: number;
    }) => {
      if (!multiChainWalletData) {
        throw new Error("Multi-chain wallet data not available");
      }

      // Get the raw multi-chain data from walletAPI
      const rawMultiChainData = walletAPI.getMultiChainWalletData();

      return transactionAPI.executeSwap(
        chainKey,
        inputToken,
        outputToken,
        amount,
        rawMultiChainData,
        slippage
      );
    },
    onSuccess: async (result, variables) => {
      console.log(`✅ Swap completed: ${result.transactionHash}`);
      console.log(
        `💰 Your fee revenue: ${result.yourFeeRevenue} ${variables.inputToken}`
      );

      // FORCE immediate refetch of total assets (bypasses staleTime)
      await queryClient.refetchQueries({ queryKey: [QueryKeys.totalAssets] });

      // FORCE immediate refetch of multi-chain token balances (for withdraw page)
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.smartWallet, "balances"],
      });

      // Invalidate transactions to show new swap
      queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });

      // Also invalidate the optimized transaction hook
      const walletAddress = multiChainWalletData?.smartAccountAddress;
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.transactions, walletAddress],
        });
      }

      // Invalidate swap quotes to get fresh data
      queryClient.invalidateQueries({ queryKey: ["swapQuote"] });
    },
  });
}

// Hook to get supported tokens for a chain
export function useSupportedSwapTokens(chainKey: SupportedChainKey) {
  return useMemo(() => {
    return odosAPI.getSupportedTokens(chainKey);
  }, [chainKey]);
}

// Hook to validate swap parameters
export function useSwapValidation(
  chainKey: SupportedChainKey,
  inputToken: string,
  outputToken: string,
  amount: string
) {
  const { data: tokenBalances } = useMultiChainTokenBalances(inputToken);

  return useMemo(() => {
    const errors: string[] = [];

    // Check if swap is supported
    if (!odosAPI.isSupportedSwap(inputToken, outputToken, chainKey)) {
      errors.push(
        `Swap ${inputToken} → ${outputToken} not supported on ${chainKey}`
      );
    }

    // Check if user has sufficient balance
    if (tokenBalances && chainKey in tokenBalances) {
      const balance = parseFloat(tokenBalances[chainKey]);
      const requestedAmount = parseFloat(amount || "0");

      if (requestedAmount > balance) {
        errors.push(
          `Insufficient ${inputToken} balance. Available: ${balance.toFixed(6)}`
        );
      }
    }

    // Check minimum amount
    const minAmount = 0.000001; // Minimum swap amount
    if (parseFloat(amount || "0") < minAmount) {
      errors.push(`Amount too small. Minimum: ${minAmount}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [chainKey, inputToken, outputToken, amount, tokenBalances]);
}

// Hook to get swap route info
export function useSwapRoute(
  inputToken: string,
  outputToken: string,
  chainKey: SupportedChainKey
) {
  return useMemo(() => {
    if (!odosAPI.isSupportedSwap(inputToken, outputToken, chainKey)) {
      return null;
    }

    return {
      inputToken,
      outputToken,
      chainKey,
      fee: "0.375%", // Total fee charged (you get 0.3%)
      yourRevenue: "0.3%", // Your actual revenue
      protocolFee: "0.075%", // Odos keeps this
    };
  }, [inputToken, outputToken, chainKey]);
}

// ========= MOCK ===========
// Wallet hooks (keeping existing mock for now)
export function useWallet() {
  return useQuery({
    queryKey: [QueryKeys.wallet],
    queryFn: () => api.getWallet(),
  });
}

// DEPRECATED: Use useTransactionsOptimized instead
// Keeping for backward compatibility but will be removed
export function useTransactions(
  walletAddress: string,
  page: number = 1,
  offset: number = 10
) {
  return useQuery({
    queryKey: [QueryKeys.transactions, walletAddress, page, offset],
    queryFn: () => transactionAPI.getTransactions(walletAddress, page, offset),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes - transactions are historical
    refetchOnWindowFocus: false, // Don't refetch transactions on focus - they're historical data
    refetchOnMount: false, // Don't always refetch on mount
    refetchOnReconnect: true, // Still refetch when network reconnects
  });
}

export function useTransactionByHash(txHash: string) {
  const queryClient = useQueryClient();
  const { data: walletData } = useMultiChainSmartWallet();
  const walletAddress = walletData?.smartAccountAddress;

  return useQuery({
    queryKey: [QueryKeys.transactions, txHash],
    queryFn: async () => {
      // First, try to find the transaction in the combined cache from useInfiniteTransactions
      if (walletAddress) {
        const combinedTransactions = queryClient.getQueryData([
          QueryKeys.transactions,
          "combined",
          walletAddress,
        ]) as Transaction[] | undefined;

        if (combinedTransactions && Array.isArray(combinedTransactions)) {
          const foundTx = combinedTransactions.find(
            (tx: Transaction) => tx.hash === txHash || tx.id === txHash
          );
          if (foundTx) {
            console.log(
              `✅ Found transaction ${txHash} in combined cache (transactions page)`
            );
            return foundTx;
          }
        }
      }

      // Second, try to find in optimized transactions cache (from home page)
      // The useTransactionsOptimized uses key: [transactions, walletAddress, page, limit]
      if (walletAddress) {
        // Try common page/limit combinations used by home page
        const commonKeys = [
          [QueryKeys.transactions, walletAddress, 1, 20], // Home page uses (1, 20)
          [QueryKeys.transactions, walletAddress, 1, 10], // Default fallback
          [QueryKeys.transactions, walletAddress, 1, 3], // Recent transactions
          [QueryKeys.transactions, walletAddress, 1, 5], // Alternative limit
        ];

        for (const key of commonKeys) {
          const optimizedTransactions = queryClient.getQueryData(key) as
            | Transaction[]
            | undefined;

          if (optimizedTransactions && Array.isArray(optimizedTransactions)) {
            const foundTx = optimizedTransactions.find(
              (tx: Transaction) => tx.hash === txHash || tx.id === txHash
            );
            if (foundTx) {
              return foundTx;
            }
          }
        }
      }

      // Third, search through all cached transaction queries
      const cachedQueries = queryClient.getQueriesData({
        queryKey: [QueryKeys.transactions],
        type: "active",
      });

      for (const [queryKey, data] of cachedQueries) {
        if (Array.isArray(data)) {
          const foundTx = data.find(
            (tx: any) => tx.hash === txHash || tx.id === txHash
          );
          if (foundTx) {
            return foundTx;
          }
        }
      }

      // If not found in any cache, fall back to API call
      console.log(
        `🔍 Transaction ${txHash} not found in any cache, fetching from API...`
      );
      return transactionAPI.getTransactionByHash(txHash);
    },
    enabled: !!txHash,
    staleTime: 10 * 60 * 1000, // 10 minutes - transactions are historical and don't change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}

export function useTransactionStatus(txHash: string) {
  return useQuery({
    queryKey: [QueryKeys.transactions, "status", txHash],
    queryFn: () => transactionAPI.getTransactionStatus(txHash),
    enabled: !!txHash,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useTransactionReceipt(txHash: string) {
  return useQuery({
    queryKey: [QueryKeys.transactions, "receipt", txHash],
    queryFn: () => transactionAPI.getTransactionReceipt(txHash),
    enabled: !!txHash,
  });
}

// Utility hook to invalidate transactions
export function useInvalidateTransactions() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });
    },
    invalidatePage: (walletAddress: string, page: number) => {
      // Invalidate specific page
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.transactions, walletAddress, page],
      });
    },
  };
}

// Vault positions hooks
export function useVaultPositions() {
  return useQuery({
    queryKey: [QueryKeys.vaultPositions],
    queryFn: () => api.getVaultPositions(),
  });
}

export function useVaultPosition(vaultId: string) {
  return useQuery({
    queryKey: QueryKeys.vaultPosition(vaultId),
    queryFn: () => api.getVaultPosition(vaultId),
    enabled: !!vaultId,
  });
}

// Hook to get total yield earned
export function useTotalYieldEarned(walletAddress: string) {
  const { getAccessToken } = usePrivy();
  
  return useQuery({
    queryKey: [QueryKeys.transactions, "totalYield", walletAddress],
    queryFn: () => transactionAPI.getTotalYieldEarned(walletAddress, async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');
      return token;
    }),
    enabled: !!walletAddress,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });
}

// Hook to get ALL transactions from backend API for yield calculations
export function useAllTransactions(walletAddress: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: [QueryKeys.transactions, "all", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];

      // Call backend API via server route with large page_size to get all vault transactions
      const token = await getAccessToken();
      if (!token) {
        throw new Error("No access token available");
      }

      const response = await fetch(
        `/api/wallets/${walletAddress}/transactions?page_size=1000&page_number=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data) return [];

      // Map the response to our Transaction type (similar to getVaultTransactions)
      const allTxs = data.data.map((tx: any) => ({
        id: tx.hash,
        type: tx.transactionType as Transaction["type"],
        date: new Date(tx.timestamp).toISOString(),
        timestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000),
        amount: tx.amount,
        token: "USDC",
        status: "completed",
        hash: tx.hash,
        smartAccountAddress: tx.fromAddress,
        vaultId:
          tx.transactionType === "withdraw" ? tx.fromAddress : tx.toAddress,
        vaultName:
          tx.transactionType === "accrue" ? "Vault Transaction" : "Transaction",
        chainId: 534352, // All vault transactions are on Scroll
        fromAddress: tx.fromAddress,
      }));

      return allTxs;
    },
    enabled: !!walletAddress,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

// Add this new hook
export function useRewards(walletAddress: string) {
  const { getAccessToken } = usePrivy();
  
  return useQuery({
    queryKey: [QueryKeys.rewards, walletAddress],
    queryFn: async () => {
      // Set up authentication for rewardAPI
      rewardAPI.setAccessTokenGetter(async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('No access token available');
        return token;
      });
      
      return rewardAPI.getUserRewards(walletAddress);
    },
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchOnWindowFocus: "always", // Only refetch if stale
    refetchOnMount: false, // Don't always refetch on mount
    refetchOnReconnect: true,
  });
}

// OPTIMIZED: Use a hybrid approach - combine vault transactions with optimized blockchain fetching
export const useTransactionsOptimized = (
  page: number = 1,
  limit: number = 10
) => {
  const { data: walletData } = useMultiChainSmartWallet();
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: [
      QueryKeys.transactions,
      walletData?.smartAccountAddress,
      page,
      limit,
    ],
    queryFn: async () => {
      if (!walletData?.smartAccountAddress) {
        return [];
      }

      // For proper pagination, we need to fetch more data than just one page
      // since we're combining different sources
      const fetchSize = Math.max(100, limit * 5);

      console.log(
        `🚀 Starting hybrid transaction fetch (vault + optimized blockchain)...`
      );
      const startTime = Date.now();

      // Fetch vault transactions and blockchain transactions in parallel
      const [vaultTransactions, blockchainTransactions] = await Promise.all([
        transactionAPI.getVaultTransactions(
          walletData.smartAccountAddress,
          1,
          fetchSize,
          async () => {
            const token = await getAccessToken();
            if (!token) throw new Error('No access token available');
            return token;
          }
        ),
        transactionAPI.getAllTokenTransfersOptimized(
          walletData.smartAccountAddress,
          1,
          fetchSize
        ),
      ]);

      // Combine both sets of transactions
      const allTransactions = [...vaultTransactions, ...blockchainTransactions];

      // Sort all transactions by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Apply pagination to combined results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

      const totalTime = Date.now() - startTime;
      console.log(
        `🎉 Hybrid transaction fetch completed in ${totalTime}ms, returning ${paginatedTransactions.length} transactions (${vaultTransactions.length} vault + ${blockchainTransactions.length} blockchain total)`
      );

      return paginatedTransactions;
    },
    enabled: !!walletData?.smartAccountAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes - transactions are historical
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
};

export function useVaultProtocolBalances(vaultConfig: VaultConfig | undefined) {
  return useQuery({
    queryKey: ["vaultProtocolBalances", vaultConfig?.id],
    queryFn: async () => {
      if (!vaultConfig) return {};
      const provider = new JsonRpcProvider("https://rpc.scroll.io");
      return getVaultProtocolBalances(provider, vaultConfig);
    },
    enabled: !!vaultConfig,
  });
}