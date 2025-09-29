'use client';

import { createSmartAccountClient } from "permissionless";
import { toKernelSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { createPublicClient, http, keccak256, toBytes, formatUnits } from "viem";
import { getActiveChainConfigs, getPimlicoUrlForChain, getChainConfig, type SupportedChainKey } from "../config/chains";
import { getChainKey } from "../utils/chain-utils";
import { MultiChainWalletData, MultiChainWalletSummary, WalletApiInterface, ChainWalletData } from "../types";
import { ERC20_ABI } from "../abis/erc20";

class WalletAPI implements WalletApiInterface {
  private static instance: WalletAPI;
  private cachedMultiChainData: MultiChainWalletData = {};
  private currentWalletAddress: string | null = null;
  private deploymentInProgress = new Set<string>();

  static getInstance(): WalletAPI {
    if (!WalletAPI.instance) {
      WalletAPI.instance = new WalletAPI();
    }
    return WalletAPI.instance;
  }

  // Initialize smart account for a specific chain
  private async initializeSmartAccountForChain(privyWallet: any, chainConfig: any): Promise<ChainWalletData> {
    try {

      // Get Ethereum provider from Privy wallet
      const ethProvider = await privyWallet.getEthereumProvider();

      // Create a public client for this chain using secure transport
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: chainConfig.secureTransport
      });

      // Create a custom signer adapter for Privy
      const privySigner = {
        address: privyWallet.address as `0x${string}`,
        type: 'local' as const,
        source: 'custom' as const,
        publicKey: '0x' as `0x${string}`,
        signTransaction: async () => '0x' as `0x${string}`,

        async signMessage({ message }: { message: string | { raw: Uint8Array | string } }) {
          const provider = await ethProvider.request({ method: "eth_requestAccounts" });

          const messageToSign = typeof message === 'string'
            ? message
            : message.raw instanceof Uint8Array
              ? new TextDecoder().decode(message.raw)
              : message.raw;

          return ethProvider.request({
            method: "personal_sign",
            params: [messageToSign, privyWallet.address]
          });
        },

        async signTypedData(params: any) {
          await ethProvider.request({ method: "eth_requestAccounts" });

          return ethProvider.request({
            method: "eth_signTypedData_v4",
            params: [privyWallet.address, JSON.stringify(params)]
          });
        }
      };

      // Create Pimlico client for bundling and paymaster services using secure transport
      const pimlicoClient = createPimlicoClient({
        transport: chainConfig.securePimlicoTransport,
        entryPoint: {
          address: chainConfig.entryPointAddress,
          version: chainConfig.entryPointVersion
        }
      });

      const getUserSalt = (privyWallet: any) => {
        const identifier = privyWallet.address.toLowerCase();
        const salt = BigInt(keccak256(toBytes(identifier)));

        return salt;
      };

      const kernelAccount = await toKernelSmartAccount({
        client: publicClient,
        owners: [privySigner],
        entryPoint: {
          address: chainConfig.entryPointAddress,
          version: chainConfig.entryPointVersion
        },
        index: getUserSalt(privyWallet) // Deterministic based on EOA address
      });

      // Create the smart account client using secure transport
      const smartAccountClient = createSmartAccountClient({
        account: kernelAccount as any,
        chain: chainConfig.chain,
        bundlerTransport: chainConfig.securePimlicoTransport,
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast;
          }
        }
      });

      // Check if the account is deployed
      const accountCode = await publicClient.getCode({ address: kernelAccount.address as `0x${string}` });
      const isDeployed = accountCode !== undefined && accountCode !== null && accountCode !== '0x' && accountCode.length > 2;
      
      return {
        smartAccount: smartAccountClient,
        smartAccountAddress: kernelAccount.address,
        isInitialized: true,
        isDeployed: isDeployed,
      };
    } catch (error) {
      console.error(`Error initializing smart account for ${chainConfig.chain.name}:`, error);
      throw error;
    }
  }

  // Initialize smart accounts on all active chains - now returns summary
  async initializeSmartAccount(privyWallet: any): Promise<MultiChainWalletSummary> {
    // Check if wallet address has changed
    if (this.currentWalletAddress && this.currentWalletAddress !== privyWallet.address) {
      this.clearWalletData();
    }

    this.currentWalletAddress = privyWallet.address;

    // Return cached summary if already initialized
    if (Object.keys(this.cachedMultiChainData).length > 0) {
      console.log("Returning cached multi-chain smart wallet summary");
      return this.getMultiChainSummary()!;
    }

    try {
      const activeChains = getActiveChainConfigs();
      const results: MultiChainWalletData = {};

      // OPTIMIZED: Initialize all chains in parallel instead of sequential
      const initPromises = activeChains.map(async (chainConfig) => {
        try {
          const chainData = await this.initializeSmartAccountForChain(privyWallet, chainConfig);
          return { chainKey: getChainKey(chainConfig.chain.name), chainData };
        } catch (error) {
          console.error(`❌ Failed to initialize on ${chainConfig.chain.name}:`, error);
          return null;
        }
      });

      // Wait for all chains to initialize in parallel
      const initResults = await Promise.all(initPromises);
      
      // Populate results from parallel initialization
      initResults.forEach(result => {
        if (result) {
          results[result.chainKey] = result.chainData;
        }
      });

      this.cachedMultiChainData = results;
      return this.getMultiChainSummary()!;
    } catch (error) {
      console.error("Error initializing multi-chain smart accounts:", error);
      throw error;
    }
  }

  // Deploy smart accounts on all active chains
  async deploySmartAccount(): Promise<boolean> {
    if (Object.keys(this.cachedMultiChainData).length === 0) {
      console.log("No smart accounts to deploy");
      return false;
    }

    try {
      let anyDeployed = false;

      for (const [chainName, chainData] of Object.entries(this.cachedMultiChainData)) {
        if (!chainData.isDeployed && chainData.smartAccount && !this.deploymentInProgress.has(chainName)) {
          try {
            this.deploymentInProgress.add(chainName);
            
            const deployTx = await chainData.smartAccount.sendTransaction({
              to: chainData.smartAccountAddress as `0x${string}`,
              value: BigInt(0),
              data: "0x",
            });
            
            chainData.isDeployed = true;
            anyDeployed = true;
            console.log(`✅ Smart account deployed on ${chainName}: ${deployTx}`);
          } catch (error) {
            console.error(`❌ Failed to deploy on ${chainName}:`, error);
          } finally {
            this.deploymentInProgress.delete(chainName);
          }
        } else if (chainData.isDeployed) {
          console.log(`Smart account already deployed on ${chainName}`);
        }
      }

      return anyDeployed;
    } catch (error) {
      console.error("Error deploying multi-chain smart accounts:", error);
      return false;
    }
  }

  /**
 * Get token balance for a specific smart account on a specific chain
 */
  async getTokenBalance(chainKey: SupportedChainKey, tokenSymbol: string): Promise<string> {
    try {
      const chainData = this.cachedMultiChainData[chainKey];
      if (!chainData?.smartAccountAddress) {
        console.log(`❌ Smart account not found for chain: ${chainKey}`);
        throw new Error(`Smart account not found for chain: ${chainKey}`);
      }

      const chainConfig = getChainConfig(chainKey);
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: chainConfig.secureTransport
      });

      // Handle ETH as native token
      if (tokenSymbol.toLowerCase() === 'eth') {
        const balance = await publicClient.getBalance({
          address: chainData.smartAccountAddress as `0x${string}`,
        });
        
        const formattedBalance = formatUnits(balance, 18); // ETH has 18 decimals
        return formattedBalance;
      }

      // Handle ERC-20 tokens (USDC, USDT, etc.)
      const normalizedTokenSymbol = tokenSymbol.toLowerCase();
      const tokenAddress = chainConfig.tokens[normalizedTokenSymbol as keyof typeof chainConfig.tokens];

      if (!tokenAddress) {
        console.log(`❌ Token ${tokenSymbol} (${normalizedTokenSymbol}) not supported on ${chainKey}`);
        throw new Error(`Token ${tokenSymbol} not supported on ${chainKey}`);
      }

      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [chainData.smartAccountAddress as `0x${string}`],
      });

      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      });

      const formattedBalance = formatUnits(balance as bigint, decimals as number);

      return formattedBalance;
    } catch (error) {
      console.error(`❌ Error getting token balance for ${tokenSymbol} on ${chainKey}:`, error);
      return "0";
    }
  }

  /**
 * Get token balances across all active chains - OPTIMIZED: Parallel fetching
 */
  async getMultiChainTokenBalances(tokenSymbol: string): Promise<{ [chainKey: string]: string }> {
    const chainKeys = Object.keys(this.cachedMultiChainData);
    
    // Fetch all chain balances in parallel
    const balancePromises = chainKeys.map(async (chainKey) => {
      try {
        const balance = await this.getTokenBalance(chainKey as SupportedChainKey, tokenSymbol);
        return { chainKey, balance };
      } catch (error) {
        console.error(`Error fetching ${tokenSymbol} balance on ${chainKey}:`, error);
        return { chainKey, balance: "0" };
      }
    });

    const results = await Promise.all(balancePromises);
    
    // Convert to the expected format
    const balances: { [chainKey: string]: string } = {};
    results.forEach(({ chainKey, balance }) => {
      balances[chainKey] = balance;
    });

    return balances;
  }

  // Main method to get wallet summary
  getMultiChainSummary(): MultiChainWalletSummary | null {
    if (Object.keys(this.cachedMultiChainData).length === 0) return null;
    
    const firstChain = Object.values(this.cachedMultiChainData)[0];
    const chains: { [chainName: string]: { isInitialized: boolean; isDeployed: boolean; smartAccount: any | null } } = {};
    
    let totalInitialized = 0;
    let totalDeployed = 0;
    
    for (const [chainName, chainData] of Object.entries(this.cachedMultiChainData)) {
      chains[chainName] = {
        isInitialized: chainData.isInitialized,
        isDeployed: chainData.isDeployed,
        smartAccount: chainData.smartAccount,
      };

      if (chainData.isInitialized) totalInitialized++;
      if (chainData.isDeployed) totalDeployed++;
    }

    return {
      embeddedWalletAddress: this.currentWalletAddress || "",
      smartAccountAddress: firstChain.smartAccountAddress || "",
      chains,
      totalChainsInitialized: totalInitialized,
      totalChainsDeployed: totalDeployed,
      isFullyDeployed: totalDeployed === Object.keys(this.cachedMultiChainData).length,
    };
  }

  // Helper method to get raw multi-chain data (for UserAPI)
  getMultiChainWalletData(): MultiChainWalletData {
    return this.cachedMultiChainData;
  }

  clearWalletData(): void {
    console.log("Clearing multi-chain wallet cache");
    this.cachedMultiChainData = {};
    this.currentWalletAddress = null;
  }

  formatAddress(address: string | null): string {
    if (!address) return '';
    return `${address.substring(0, 12)}...${address.substring(address.length - 12)}`;
  }
}

export const walletAPI = WalletAPI.getInstance();

