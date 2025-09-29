"use client";

import { createPublicClient, http, formatUnits } from "viem";
import { getActiveChainConfigs, getTokenAddress } from "../config/chains";
import { UserData, UserApiInterface } from "../types";
import { ERC20_ABI } from "../abis";
import { trackerAPI } from "./tracker-api";
import { getVaultConfig } from "../config/vaults";
import { isTokenSupportedOnChain } from "../config/select-token";

class UserAPI implements UserApiInterface {
  private static instance: UserAPI;
  private publicClient: any;

  constructor() {
    // Use the first active chain for user data queries
    const chainConfig = getActiveChainConfigs()[0];
    this.publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: chainConfig.secureTransport,
    });
  }

  static getInstance(): UserAPI {
    if (!UserAPI.instance) {
      UserAPI.instance = new UserAPI();
    }
    return UserAPI.instance;
  }

  // Parse name from email (everything before @)
  private parseNameFromEmail(email: string): string {
    if (!email) return "User";

    const name = email.split("@")[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return name
      .replace(/[._]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Generate default name based on login method
  getDefaultDisplayName(privyUser: any): string {
    if (privyUser?.email?.address) {
      return this.parseNameFromEmail(privyUser.email.address);
    }
    return "User"; // For EOA users, just show "User"
  }

  // Get additional info to show below the name, "Metamask: 0x.."
  getAdditionalUserInfo(privyUser: any, wallets: any[]): string | null {
    if (privyUser?.email?.address) {
      return privyUser.email.address; // Show email for email login
    }

    // Find any injected wallet (MetaMask, Phantom, etc.)
    const authenticatedWallet = wallets.find(
      (w) =>
        w.connectorType === "injected" &&
        w.address === privyUser?.wallet?.address // Match the authenticated wallet address
    );
    if (authenticatedWallet?.walletClientType) {
      return authenticatedWallet.walletClientType.toLowerCase();
    }

    return null;
  }

  // Update the existing getDefaultName method to use the new one
  private getDefaultName(privyUser: any, multiChainWalletData?: any): string {
    if (privyUser?.email?.address) {
      return this.parseNameFromEmail(privyUser.email.address);
    } else if (multiChainWalletData) {
      // Get first smart wallet address for EOA users (not embedded wallet)
      const firstChain = Object.values(multiChainWalletData)[0] as any;
      if (firstChain?.smartAccountAddress) {
        const address = firstChain.smartAccountAddress;
        const shortAddress = `${address.substring(0, 6)}...${address.substring(
          address.length - 4
        )}`;
        return `User ${shortAddress}`;
      }
    }
    return "User";
  }

  // Get user's display name (custom or default)
  private async getUserDisplayName(
    privyUser: any,
    multiChainWalletData?: any
  ): Promise<string> {
    // Get smart account address from summary (not embedded wallet address)
    const smartAccountAddress =
      multiChainWalletData?.smartAccountAddress || null;

    // Check if user has a custom name in tracker API using smart account address
    if (smartAccountAddress) {
      try {
        const trackerName = await trackerAPI.getUsernameByWallet(
          smartAccountAddress
        );
        if (trackerName) {
          return trackerName;
        }
      } catch (error) {
        console.error("Error fetching username from tracker API:", error);
      }
    }

    // Fall back to default name generation
    return this.getDefaultName(privyUser, multiChainWalletData);
  }

  // Format USDC balance for display
  formatUsdcBalance(balance: string): string {
    const num = parseFloat(balance);
    if (num === 0) return "$0.00";
    if (num < 0.01) return "<$0.01";
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Format token balance for display
  formatTokenBalance(balance: string, symbol: string): string {
    const num = parseFloat(balance);
    if (num === 0) return `0.00 ${symbol}`;
    if (num < 0.01) return `<0.01 ${symbol}`;
    return `${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })} ${symbol}`;
  }

  // Get ETH balance for specific chain (native balance)
  async getEthBalanceForChain(
    address: string,
    chainConfig: any
  ): Promise<string> {
    try {
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: chainConfig.secureTransport,
      });

      // Get native ETH balance
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      const formattedBalance = formatUnits(balance, 18); // ETH has 18 decimals

      return formattedBalance;
    } catch (error) {
      console.error(
        `Error fetching ETH balance for ${chainConfig.chain.name}:`,
        error
      );
      return "0";
    }
  }

  // Get USDT balance for specific chain
  async getUsdtBalanceForChain(
    address: string,
    chainConfig: any
  ): Promise<string> {
    try {
      // Check if chain supports USDT
      if (!chainConfig.tokens.usdt) {
        return "0";
      }

      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: chainConfig.secureTransport,
      });

      const balance = (await publicClient.readContract({
        address: chainConfig.tokens.usdt,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })) as bigint;

      const decimals = (await publicClient.readContract({
        address: chainConfig.tokens.usdt,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const formattedBalance = formatUnits(balance, decimals);

      return formattedBalance;
    } catch (error) {
      console.error(
        `Error fetching USDT balance for ${chainConfig.chain.name}:`,
        error
      );
      return "0";
    }
  }

  // Add method to get both Virtual Vault and Combined Vault balances for Scroll
  async getAggregatedVaultBalanceForScroll(address: string): Promise<{
    virtualVault: {
      vvtBalance: string;
      withdrawableUsdc: string;
    };
    combinedVault: {
      cvtBalance: string;
      withdrawableUsdc: string;
    };
    totalWithdrawableUsdc: string;
  }> {
    try {
      const scrollConfig = getActiveChainConfigs().find(
        (config) => config.chain.name === "Scroll"
      );
      if (!scrollConfig) {
        throw new Error("Scroll chain config not found");
      }

      const publicClient = createPublicClient({
        chain: scrollConfig.chain,
        transport: scrollConfig.secureTransport,
      });

      // Get all active vault configs
      const { getActiveVaults } = await import("../config/vaults");
      const activeVaults = getActiveVaults();

      let totalVirtualWithdrawable = 0;
      let totalCombinedWithdrawable = 0;
      let totalVirtualBalance = "0";
      let totalCombinedBalance = "0";

      // OPTIMIZED: Create all vault contract calls in parallel instead of sequential
      const vaultPromises = activeVaults.flatMap(vaultConfig => {
        const { virtualVaultAddress, combinedVaultAddress } = vaultConfig;
        
        const convertToAssetsAbi = [
          {
            inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
            name: "convertToAssets", 
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ];

        return [
          // Virtual Vault calls
          {
            type: 'vv-balance',
            vaultName: vaultConfig.name,
            promise: publicClient.readContract({
              address: virtualVaultAddress,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            })
          },
          {
            type: 'vv-decimals',
            vaultName: vaultConfig.name,
            promise: publicClient.readContract({
              address: virtualVaultAddress,
              abi: ERC20_ABI,
              functionName: "decimals",
            })
          },
          // Combined Vault calls
          {
            type: 'cv-balance',
            vaultName: vaultConfig.name,
            promise: publicClient.readContract({
              address: combinedVaultAddress,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            })
          },
          {
            type: 'cv-decimals',
            vaultName: vaultConfig.name,
            promise: publicClient.readContract({
              address: combinedVaultAddress,
              abi: ERC20_ABI,
              functionName: "decimals",
            })
          }
        ];
      });

      console.log(`🚀 Executing ${vaultPromises.length} vault calls in parallel...`);

      // Execute all basic calls in parallel
      const basicResults = await Promise.allSettled(vaultPromises.map(p => p.promise));

      // Process basic results and create conversion calls
      const conversionPromises = [];
      const vaultData: { [vaultName: string]: any } = {};

      // Group results by vault
      for (let i = 0; i < basicResults.length; i++) {
        const result = basicResults[i];
        const { type, vaultName } = vaultPromises[i];

        if (!vaultData[vaultName]) {
          vaultData[vaultName] = {};
        }

        if (result.status === 'fulfilled') {
          vaultData[vaultName][type] = result.value;
        } else {
          console.error(`Error in ${type} for ${vaultName}:`, result.reason);
          vaultData[vaultName][type] = type.includes('balance') ? BigInt(0) : 6; // default decimals
        }
      }

      // Create conversion calls for non-zero balances
      for (const [vaultName, data] of Object.entries(vaultData)) {
        const vaultConfig = activeVaults.find(v => v.name === vaultName)!;
        const { virtualVaultAddress, combinedVaultAddress } = vaultConfig;

        const convertToAssetsAbi = [
          {
            inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
            name: "convertToAssets",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ];

        // Add VV conversion if balance > 0
        if (data['vv-balance'] && BigInt(data['vv-balance']) > BigInt(0)) {
          conversionPromises.push({
            type: 'vv-convert',
            vaultName,
            promise: publicClient.readContract({
              address: virtualVaultAddress,
              abi: convertToAssetsAbi,
              functionName: "convertToAssets",
              args: [data['vv-balance']],
            })
          });
        }

        // Add CV conversion if balance > 0
        if (data['cv-balance'] && BigInt(data['cv-balance']) > BigInt(0)) {
          conversionPromises.push({
            type: 'cv-convert',
            vaultName,
            promise: publicClient.readContract({
              address: combinedVaultAddress,
              abi: convertToAssetsAbi,
              functionName: "convertToAssets",
              args: [data['cv-balance']],
            })
          });
        }
      }

      // Execute conversion calls in parallel
      const conversionResults = await Promise.allSettled(conversionPromises.map(p => p.promise));

      // Process conversion results
      for (let i = 0; i < conversionResults.length; i++) {
        const result = conversionResults[i];
        const { type, vaultName } = conversionPromises[i];

        if (result.status === 'fulfilled') {
          vaultData[vaultName][type] = result.value;
        } else {
          console.error(`Error in ${type} for ${vaultName}:`, result.reason);
          vaultData[vaultName][type] = BigInt(0);
        }
      }

      // Process all vault data and aggregate
      for (const [vaultName, data] of Object.entries(vaultData)) {
        const vvtBalance = BigInt(data['vv-balance'] || 0);
        const vvtDecimals = Number(data['vv-decimals'] || 6);
        const cvtBalance = BigInt(data['cv-balance'] || 0);
        const cvtDecimals = Number(data['cv-decimals'] || 6);

        const formattedVvtBalance = formatUnits(vvtBalance, vvtDecimals);
        const formattedCvtBalance = formatUnits(cvtBalance, cvtDecimals);

        // Calculate withdrawable amounts
        let virtualVaultWithdrawableUsdc = "0";
        if (vvtBalance > BigInt(0) && data['vv-convert']) {
          virtualVaultWithdrawableUsdc = formatUnits(BigInt(data['vv-convert']), 6);
          console.log(`[${vaultName} Virtual Vault] VVT Balance: ${formattedVvtBalance}, Withdrawable: ${virtualVaultWithdrawableUsdc}`);
        }

        let combinedVaultWithdrawableUsdc = "0";
        if (cvtBalance > BigInt(0) && data['cv-convert']) {
          combinedVaultWithdrawableUsdc = formatUnits(BigInt(data['cv-convert']), 6);
          console.log(`[${vaultName} Combined Vault] CVT Balance: ${formattedCvtBalance}, Withdrawable: ${combinedVaultWithdrawableUsdc}`);
        }

        // Aggregate the totals
        totalVirtualWithdrawable += parseFloat(virtualVaultWithdrawableUsdc);
        totalCombinedWithdrawable += parseFloat(combinedVaultWithdrawableUsdc);
        totalVirtualBalance = (parseFloat(totalVirtualBalance) + parseFloat(formattedVvtBalance)).toString();
        totalCombinedBalance = (parseFloat(totalCombinedBalance) + parseFloat(formattedCvtBalance)).toString();
      }

      // Calculate total withdrawable USDC across all vaults
      const totalWithdrawableUsdc = (
        totalVirtualWithdrawable + totalCombinedWithdrawable
      ).toString();

      console.log(
        `[Aggregated] Total withdrawable USDC across all active vaults: ${totalWithdrawableUsdc}`
      );

      return {
        virtualVault: {
          vvtBalance: totalVirtualBalance,
          withdrawableUsdc: totalVirtualWithdrawable.toString(),
        },
        combinedVault: {
          cvtBalance: totalCombinedBalance,
          withdrawableUsdc: totalCombinedWithdrawable.toString(),
        },
        totalWithdrawableUsdc: totalWithdrawableUsdc,
      };
    } catch (error) {
      console.error("Error fetching aggregated vault balance:", error);
      return {
        virtualVault: {
          vvtBalance: "0",
          withdrawableUsdc: "0",
        },
        combinedVault: {
          cvtBalance: "0",
          withdrawableUsdc: "0",
        },
        totalWithdrawableUsdc: "0",
      };
    }
  }

  // Add method to get USDC balance for specific chain
  async getUsdcBalanceForChain(
    address: string,
    chainConfig: any
  ): Promise<string> {
    try {
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: chainConfig.secureTransport,
      });

      const balance = (await publicClient.readContract({
        address: chainConfig.tokens.usdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })) as bigint;

      const decimals = (await publicClient.readContract({
        address: chainConfig.tokens.usdc,
        abi: ERC20_ABI,
        functionName: "decimals",
      })) as number;

      const formattedBalance = formatUnits(balance, decimals);

      return formattedBalance;
    } catch (error) {
      console.error(
        `Error fetching USDC balance for ${chainConfig.chain.name}:`,
        error
      );
      console.error(`Full error details:`, error);
      return "0";
    }
  }

  // Get individual vault balances for each active vault
  async getIndividualVaultBalances(
    address: string
  ): Promise<{ [vaultId: string]: string }> {
    try {
      const scrollConfig = getActiveChainConfigs().find(
        (config) => config.chain.name === "Scroll"
      );
      if (!scrollConfig) {
        throw new Error("Scroll chain config not found");
      }

      const publicClient = createPublicClient({
        chain: scrollConfig.chain,
        transport: scrollConfig.secureTransport,
      });

      // Get all active vault configs
      const { getActiveVaults } = await import("../config/vaults");
      const activeVaults = getActiveVaults();

      const individualBalances: { [vaultId: string]: string } = {};

      // Get balance for each active vault
      for (const vaultConfig of activeVaults) {
        const { virtualVaultAddress, combinedVaultAddress } = vaultConfig;

        try {
          // Get Virtual Vault balance
          const vvtBalance = (await publicClient.readContract({
            address: virtualVaultAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          })) as bigint;

          // Get Combined Vault balance
          const cvtBalance = (await publicClient.readContract({
            address: combinedVaultAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          })) as bigint;

          // Convert to withdrawable USDC amounts
          let totalWithdrawable = 0;

          if (vvtBalance > BigInt(0)) {
            try {
              const withdrawableUsdcRaw = (await publicClient.readContract({
                address: virtualVaultAddress,
                abi: [
                  {
                    inputs: [
                      {
                        internalType: "uint256",
                        name: "shares",
                        type: "uint256",
                      },
                    ],
                    name: "convertToAssets",
                    outputs: [
                      { internalType: "uint256", name: "", type: "uint256" },
                    ],
                    stateMutability: "view",
                    type: "function",
                  },
                ],
                functionName: "convertToAssets",
                args: [vvtBalance],
              })) as bigint;

              totalWithdrawable += parseFloat(
                formatUnits(withdrawableUsdcRaw, 6)
              );
            } catch (convertError) {
              console.error(
                `Error converting VVT to assets for ${vaultConfig.name}:`,
                convertError
              );
            }
          }

          if (cvtBalance > BigInt(0)) {
            try {
              const withdrawableUsdcRaw = (await publicClient.readContract({
                address: combinedVaultAddress,
                abi: [
                  {
                    inputs: [
                      {
                        internalType: "uint256",
                        name: "shares",
                        type: "uint256",
                      },
                    ],
                    name: "convertToAssets",
                    outputs: [
                      { internalType: "uint256", name: "", type: "uint256" },
                    ],
                    stateMutability: "view",
                    type: "function",
                  },
                ],
                functionName: "convertToAssets",
                args: [cvtBalance],
              })) as bigint;

              totalWithdrawable += parseFloat(
                formatUnits(withdrawableUsdcRaw, 6)
              );
            } catch (convertError) {
              console.error(
                `Error converting CVT to assets for ${vaultConfig.name}:`,
                convertError
              );
            }
          }

          individualBalances[vaultConfig.id] = totalWithdrawable.toString();
        } catch (vaultError) {
          console.error(
            `Error fetching balance for vault ${vaultConfig.name}:`,
            vaultError
          );
          individualBalances[vaultConfig.id] = "0";
        }
      }

      return individualBalances;
    } catch (error) {
      console.error("Error fetching individual vault balances:", error);
      return {};
    }
  }

  // Add this new method to fetch balances in parallel for better performance
  async getParallelBalances(address: string): Promise<{
    usdcBalance: number;
    ethBalance: number; 
    usdtBalance: number;
  }> {
    try {
      const activeChains = getActiveChainConfigs();
      
      // Create all balance fetch promises in parallel
      const balancePromises = activeChains.flatMap(chainConfig => {
        const chainNameLower = chainConfig.chain.name.toLowerCase();
        const promises = [];
        
        // USDC (all chains)
        promises.push(
          this.getUsdcBalanceForChain(address, chainConfig)
            .then(balance => ({ chain: chainConfig.chain.name, token: 'USDC', balance: parseFloat(balance) }))
            .catch(error => {
              console.error(`Error fetching USDC from ${chainConfig.chain.name}:`, error);
              return { chain: chainConfig.chain.name, token: 'USDC', balance: 0 };
            })
        );
        
        // ETH (if supported)
        if (isTokenSupportedOnChain('eth', chainNameLower)) {
          promises.push(
            this.getEthBalanceForChain(address, chainConfig)
              .then(balance => ({ chain: chainConfig.chain.name, token: 'ETH', balance: parseFloat(balance) }))
              .catch(error => {
                console.error(`Error fetching ETH from ${chainConfig.chain.name}:`, error);
                return { chain: chainConfig.chain.name, token: 'ETH', balance: 0 };
              })
          );
        }
        
        // USDT (if supported)
        if (isTokenSupportedOnChain('usdt', chainNameLower)) {
          promises.push(
            this.getUsdtBalanceForChain(address, chainConfig)
              .then(balance => ({ chain: chainConfig.chain.name, token: 'USDT', balance: parseFloat(balance) }))
              .catch(error => {
                console.error(`Error fetching USDT from ${chainConfig.chain.name}:`, error);
                return { chain: chainConfig.chain.name, token: 'USDT', balance: 0 };
              })
          );
        }
        
        return promises;
      });

      console.log(`🚀 Fetching ${balancePromises.length} balances in parallel...`);
      
      // Execute all balance fetches in parallel
      const results = await Promise.all(balancePromises);
      
      // Aggregate results by token
      const totals = results.reduce((acc, result) => {
        acc[result.token.toLowerCase()] = (acc[result.token.toLowerCase()] || 0) + result.balance;
        return acc;
      }, {} as { [key: string]: number });
      
      console.log(`✅ Parallel balances fetched:`, totals);
      
      return {
        usdcBalance: totals.usdc || 0,
        ethBalance: totals.eth || 0,
        usdtBalance: totals.usdt || 0,
      };
    } catch (error) {
      console.error("Error fetching parallel balances:", error);
      return {
        usdcBalance: 0,
        ethBalance: 0,
        usdtBalance: 0,
      };
    }
  }

  // Update getUserData method to accept multi-chain wallet summary
  async getUserData(
    privyUser: any,
    multiChainWalletSummary?: any,
    getAccessToken?: () => Promise<string>
  ): Promise<UserData> {
    try {
      // Set up authentication for trackerAPI FIRST before any calls
      if (getAccessToken) {
        trackerAPI.setAccessTokenGetter(async () => {
          const token = await getAccessToken();
          if (!token) throw new Error('No access token available');
          return token;
        });
      }

      // Parse user info from Privy
      const email = privyUser?.email?.address || "";
      const name = await this.getUserDisplayName(
        privyUser,
        multiChainWalletSummary
      );
      const walletAddress = privyUser?.wallet?.address || null;

      // Get USDC balances from all active chains
      const usdcBalances: { [chainName: string]: string } = {};
      const usdcBalancesFormatted: { [chainName: string]: string } = {};
      const ethBalances: { [chainName: string]: string } = {};
      const ethBalancesFormatted: { [chainName: string]: string } = {};
      const usdtBalances: { [chainName: string]: string } = {};
      const usdtBalancesFormatted: { [chainName: string]: string } = {};

      // Declare total balance variables
      let totalUsdcBalance: string;
      let totalEthBalance: string;
      let totalUsdtBalance: string;

      if (multiChainWalletSummary?.smartAccountAddress) {
        // Use parallel balance fetching instead of sequential for loop
        const parallelBalances = await this.getParallelBalances(
          multiChainWalletSummary.smartAccountAddress
        );
        
        // Convert parallel results to the expected format for backward compatibility
        const activeChains = getActiveChainConfigs();
        
        // Distribute balances across chains (for display purposes)
        // In reality, the parallel method aggregates across all chains
        for (const chainConfig of activeChains) {
          const chainName = chainConfig.chain.name;
          const chainNameLower = chainConfig.chain.name.toLowerCase();
          
          // For now, put all balances on the first supported chain for each token
          // This maintains backward compatibility with existing UI expectations
          const isFirstUsdcChain = chainName === activeChains[0].chain.name;
          const isFirstEthChain = isTokenSupportedOnChain('eth', chainNameLower) && 
                                  !Object.keys(ethBalances).some(key => parseFloat(ethBalances[key]) > 0);
          const isFirstUsdtChain = isTokenSupportedOnChain('usdt', chainNameLower) && 
                                   !Object.keys(usdtBalances).some(key => parseFloat(usdtBalances[key]) > 0);
          
          // USDC - put total on first chain
          if (isFirstUsdcChain) {
            usdcBalances[chainName] = parallelBalances.usdcBalance.toString();
            usdcBalancesFormatted[chainName] = this.formatUsdcBalance(parallelBalances.usdcBalance.toString());
          } else {
            usdcBalances[chainName] = "0";
            usdcBalancesFormatted[chainName] = "$0.00";
          }
          
          // ETH - put total on first supported chain
          if (isTokenSupportedOnChain('eth', chainNameLower)) {
            if (isFirstEthChain) {
              ethBalances[chainName] = parallelBalances.ethBalance.toString();
              ethBalancesFormatted[chainName] = this.formatTokenBalance(parallelBalances.ethBalance.toString(), 'ETH');
            } else {
              ethBalances[chainName] = "0";
              ethBalancesFormatted[chainName] = "0.00 ETH";
            }
          } else {
            ethBalances[chainName] = "0";
            ethBalancesFormatted[chainName] = "0.00 ETH";
          }
          
          // USDT - put total on first supported chain
          if (isTokenSupportedOnChain('usdt', chainNameLower)) {
            if (isFirstUsdtChain) {
              usdtBalances[chainName] = parallelBalances.usdtBalance.toString();
              usdtBalancesFormatted[chainName] = this.formatUsdcBalance(parallelBalances.usdtBalance.toString());
            } else {
              usdtBalances[chainName] = "0";
              usdtBalancesFormatted[chainName] = "$0.00";
            }
          } else {
            usdtBalances[chainName] = "0";
            usdtBalancesFormatted[chainName] = "$0.00";
          }
        }
        
        // Use the parallel results directly for totals
         totalUsdcBalance = parallelBalances.usdcBalance.toString();
         totalEthBalance = parallelBalances.ethBalance.toString();
         totalUsdtBalance = parallelBalances.usdtBalance.toString();
      } else {
        // Fallback: use single chain if no multi-chain data
        const firstChainConfig = getActiveChainConfigs()[0];
        usdcBalances[firstChainConfig.chain.name] = "0";
        usdcBalancesFormatted[firstChainConfig.chain.name] = "$0.00";
        ethBalances[firstChainConfig.chain.name] = "0";
        ethBalancesFormatted[firstChainConfig.chain.name] = "0.00 ETH";
        usdtBalances[firstChainConfig.chain.name] = "0";
        usdtBalancesFormatted[firstChainConfig.chain.name] = "$0.00";
        
        totalUsdcBalance = "0";
        totalEthBalance = "0";
        totalUsdtBalance = "0";
      }
         
      console.log(`📊 Total balances calculated (using parallel API calls):`, {
        totalEthBalance,
        totalUsdtBalance,
        totalUsdcBalance
      });

      // Get aggregated vault balances if smart account exists
      let vaultData = {
        virtualVault: { vvtBalance: "0", withdrawableUsdc: "0" },
        combinedVault: { cvtBalance: "0", withdrawableUsdc: "0" },
        totalWithdrawableUsdc: "0",
      };

      // Add individual vault balances for position tracking
      let individualVaultBalances: { [vaultId: string]: string } = {};

      if (multiChainWalletSummary?.smartAccountAddress) {
        vaultData = await this.getAggregatedVaultBalanceForScroll(
          multiChainWalletSummary.smartAccountAddress
        );

        // Also get individual vault balances
        individualVaultBalances = await this.getIndividualVaultBalances(
          multiChainWalletSummary.smartAccountAddress
        );
      }

      return {
        id: privyUser?.id || "unknown",
        name,
        email,
        embeddedWalletAddress: multiChainWalletSummary?.embeddedWalletAddress,
        smartWalletAddress: multiChainWalletSummary?.smartAccountAddress,
        usdcBalances,
        usdcBalancesFormatted,
        totalUsdcBalance: totalUsdcBalance,
        totalUsdcBalanceFormatted: this.formatUsdcBalance(totalUsdcBalance),
        ethBalances,
        ethBalancesFormatted,
        totalEthBalance: totalEthBalance,
        totalEthBalanceFormatted: this.formatTokenBalance(totalEthBalance, 'ETH'),
        usdtBalances,
        usdtBalancesFormatted,
        totalUsdtBalance: totalUsdtBalance,
        totalUsdtBalanceFormatted: this.formatUsdcBalance(totalUsdtBalance),
        virtualVault: vaultData.virtualVault,
        combinedVault: vaultData.combinedVault,
        totalWithdrawableUsdc: vaultData.totalWithdrawableUsdc,
        totalWithdrawableUsdcFormatted: this.formatUsdcBalance(
          vaultData.totalWithdrawableUsdc
        ),
        individualVaultBalances,
      };
    } catch (error) {
      console.error("Error getting user data:", error);

      // Return fallback data with all required properties
      return {
        id: "unknown",
        name: "User",
        email: "",
        embeddedWalletAddress: null,
        smartWalletAddress: null,
        usdcBalances: {},
        usdcBalancesFormatted: {},
        totalUsdcBalance: "0",
        totalUsdcBalanceFormatted: "$0.00",
        ethBalances: {},
        ethBalancesFormatted: {},
        totalEthBalance: "0",
        totalEthBalanceFormatted: "0.00 ETH",
        usdtBalances: {},
        usdtBalancesFormatted: {},
        totalUsdtBalance: "0",
        totalUsdtBalanceFormatted: "$0.00",
        virtualVault: { vvtBalance: "0", withdrawableUsdc: "0" },
        combinedVault: { cvtBalance: "0", withdrawableUsdc: "0" },
        totalWithdrawableUsdc: "0",
        totalWithdrawableUsdcFormatted: "$0.00",
        individualVaultBalances: {},
      };
    }
  }

  // Validate referral code using server API
  async validateReferralCode(referralCode: string, getAccessToken: () => Promise<string>): Promise<boolean> {
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/users/validate-referral', {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ referral_code: referralCode }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return !!data.is_valid;
    } catch (error) {
      console.error("Error validating referral code:", error);
      return false;
    }
  }

}

// Export singleton instance
export const userAPI = UserAPI.getInstance();