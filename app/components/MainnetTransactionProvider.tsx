"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { ethers, parseUnits, formatUnits } from "ethers";
import { useUserData, useMultiChainSmartWallet } from "@/app/lib/hooks";
import { VIRTUAL_VAULT_ABI } from "@/app/lib/abis/virtualVault";
import { COMBINED_VAULT_ABI } from "@/app/lib/abis/combinedVault";
import { getChainConfig } from "@/app/lib/config/chains";
import { getVaultConfig } from "@/app/lib/config/vaults";

// Across Protocol V3 SpokePool addresses
const ACROSS_SPOKE_POOL_ADDRESSES = {
  base: "0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64",
  scroll: "0x3bad7ad0728f9917d1bf08af5782dcbd516cdd96",
} as const;

// Across MulticallHandler addresses (audited generic handler)
const ACROSS_MULTICALL_HANDLER_ADDRESSES = {
  scroll: "0x924a9f036260DdD5808007E1AA95f08eD08aA569", // From user's message
} as const;

// Destination chain IDs for Across
const ACROSS_CHAIN_IDS = {
  base: 8453,
  scroll: 534352,
} as const;

// Across SpokePool ABI (minimal required functions)
const ACROSS_SPOKE_POOL_ABI = [
  "function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityParameter, bytes calldata message) payable",
] as const;

// Mainnet contract addresses
const USDC_MAINNET_ADDRESS = "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4"; // USDC on Scroll
const vaultConfig = getVaultConfig('stableyield');
if (!vaultConfig) {
  throw new Error("Stable yield vault config not found");
}
const { virtualVaultAddress, combinedVaultAddress } = vaultConfig;


// ERC20 ABI for USDC operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

interface MainnetTransactionContextType {
  transferWalletToVault: (
    amount: number | undefined
  ) => Promise<
    { success: boolean; transactionHash?: string; crossChain?: boolean } | undefined
  >;
  transferVaultToWallet: (
    amount: number | undefined
  ) => Promise<{ success: boolean; withdrawHash?: string } | undefined>;
  getMaxDepositableAmount: () => Promise<number>;
  depositAfterBridge: (amount: number) => Promise<{ success: boolean; transactionHash?: string } | undefined>;
}

const MainnetTransactionContext = createContext<MainnetTransactionContextType | undefined>(
  undefined
);

interface MainnetTransactionProviderProps {
  children: ReactNode;
}

export function MainnetTransactionProvider({ children }: MainnetTransactionProviderProps) {
  const { data: userData, refetch: refreshUserInfo } = useUserData();
  const { data: smartWalletData } = useMultiChainSmartWallet();
  
  const smartAccountAddress = smartWalletData?.smartAccountAddress || "";
  // Get smart accounts for both chains
  const scrollSmartAccount = smartWalletData?.chains?.["scroll"]?.smartAccount || null;
  const baseSmartAccount = smartWalletData?.chains?.["base"]?.smartAccount || null;

  // Helper function to check USDC balance on Base
  const checkBaseBalance = useCallback(
    async (): Promise<number> => {
      try {
        const baseConfig = getChainConfig("base");
        const provider = new ethers.JsonRpcProvider(baseConfig.rpcUrl);
        const usdcContract = new ethers.Contract(
          baseConfig.tokens.usdc,
          ERC20_ABI,
          provider
        );

        const balance = await usdcContract.balanceOf(smartAccountAddress);
        return parseFloat(formatUnits(balance, 6));
      } catch (error) {
        console.error("Error checking Base balance:", error);
        return 0;
      }
    },
    [smartAccountAddress]
  );

  // Helper function to generate multicall message for vault deposit
  const generateVaultDepositMessage = useCallback(
    (outputAmount: string) => {
      const scrollConfig = getChainConfig("scroll");
      
      // Create approve calldata for USDC -> Virtual Vault
      const usdcInterface = new ethers.Interface(ERC20_ABI);
      const approveCalldata = usdcInterface.encodeFunctionData("approve", [
        virtualVaultAddress,
        outputAmount,
      ]);

      // Create vault deposit calldata
      const vaultInterface = new ethers.Interface(VIRTUAL_VAULT_ABI);
      const depositCalldata = vaultInterface.encodeFunctionData("deposit(uint256,address)", [
        outputAmount,
        smartAccountAddress,
      ]);

      // Create calls array as tuples for proper ABI encoding
      const calls = [
        [scrollConfig.tokens.usdc, approveCalldata, 0],
        [virtualVaultAddress, depositCalldata, 0],
      ];

      // Encode the Instructions struct with proper tuple format
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      return abiCoder.encode(
        [
          "tuple(" +
            "tuple(address,bytes,uint256)[]," +
            "address" +
          ")"
        ],
        [
          [
            calls,
            smartAccountAddress
          ]
        ]
      );
    },
    [smartAccountAddress]
  );

  // Helper function to get Across quote
  const getAcrossQuote = useCallback(
    async (inputAmount: number, message: string) => {
      try {
        const baseConfig = getChainConfig("base");
        const scrollConfig = getChainConfig("scroll");
        
        const params = new URLSearchParams({
          inputToken: baseConfig.tokens.usdc,
          outputToken: scrollConfig.tokens.usdc,
          amount: parseUnits(inputAmount.toString(), 6).toString(),
          originChainId: ACROSS_CHAIN_IDS.base.toString(),
          destinationChainId: ACROSS_CHAIN_IDS.scroll.toString(),
          recipient: ACROSS_MULTICALL_HANDLER_ADDRESSES.scroll,
          message: message,
        });

        const response = await fetch(
          `https://app.across.to/api/suggested-fees?${params.toString()}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Across API error response:", errorText);
          throw new Error(`Across API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Across quote response:", data);
        
        return {
          outputAmount: data.outputAmount,
          totalRelayFee: data.totalRelayFee,
          quoteTimestamp: data.timestamp,
          fillDeadline: data.fillDeadline || Math.floor(Date.now() / 1000) + 7200,
          exclusivityParameter: data.exclusivityParameter || 0,
        };
      } catch (error) {
        console.error("Error getting Across quote:", error);
        throw error;
      }
    },
    []
  );

  // Helper function to calculate maximum depositable amount
  const getMaxDepositableAmount = useCallback(
    async (): Promise<number> => {
      try {
        if (!scrollSmartAccount || !smartAccountAddress) {
          return 0;
        }

        // Get Scroll balance
        const scrollConfig = getChainConfig("scroll");
        const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
        const usdcContract = new ethers.Contract(
          scrollConfig.tokens.usdc,
          ERC20_ABI,
          provider
        );
        const scrollBalance = await usdcContract.balanceOf(smartAccountAddress);
        const scrollBalanceFormatted = parseFloat(formatUnits(scrollBalance, 6));

        // Get Base balance
        const baseBalance = await checkBaseBalance();

        if (baseBalance === 0) {
          // Only Scroll balance available
          return scrollBalanceFormatted;
        }

        // Calculate max after bridging all Base funds
        const sweepOutputAmount = parseUnits(baseBalance.toString(), 6).toString();
        const sweepMessage = generateVaultDepositMessage(sweepOutputAmount);
        const sweepQuote = await getAcrossQuote(baseBalance, sweepMessage);
        const expectedSweepOutput = parseFloat(formatUnits(sweepQuote.outputAmount, 6));
        
        return scrollBalanceFormatted + expectedSweepOutput;
      } catch (error) {
        console.error("Error calculating max depositable amount:", error);
        return 0;
      }
    },
    [scrollSmartAccount, smartAccountAddress, checkBaseBalance, generateVaultDepositMessage, getAcrossQuote]
  );

  // Function to deposit after a bridge completes
  const depositAfterBridge = useCallback(
    async (amount: number): Promise<{ success: boolean; transactionHash?: string } | undefined> => {
      if (!amount || !scrollSmartAccount || !smartAccountAddress) {
        console.error("Missing amount or Scroll smart account not initialized");
        return;
      }

      try {
        console.log(`Automatic deposit after bridge: ${amount} USDC`);
        
        // Get Scroll chain config for contract calls
        const scrollConfig = getChainConfig("scroll");
        
        // Create USDC contract instance
        const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
        const usdcContract = new ethers.Contract(
          scrollConfig.tokens.usdc,
          ERC20_ABI,
          provider
        );

        // Check current allowance for Virtual Vault
        const currentAllowance = await usdcContract.allowance(
          smartAccountAddress,
          virtualVaultAddress
        );

        const amountInWei = parseUnits(amount.toString(), 6);
        const calls = [];

        // Only approve if current allowance is less than the transfer amount
        if (currentAllowance < amountInWei) {
          console.log("Adding approval transaction to batch...");

          // Approve a large amount to avoid future approvals
          const largeAllowance = parseUnits("1000000", 6); // 1 million USDC

          // Create the USDC approve call data
          const usdcInterface = new ethers.Interface(ERC20_ABI);
          const approveCalldata = usdcInterface.encodeFunctionData("approve", [
            virtualVaultAddress,
            largeAllowance,
          ]);

          calls.push({
            to: scrollConfig.tokens.usdc,
            data: approveCalldata,
          });
        }

        // Create the virtual vault deposit call data
        const vaultInterface = new ethers.Interface(VIRTUAL_VAULT_ABI);
        const depositCalldata = vaultInterface.encodeFunctionData("deposit(uint256,address)", [
          amountInWei,
          smartAccountAddress,
        ]);

        calls.push({
          to: virtualVaultAddress,
          data: depositCalldata,
        });

        console.log(`Sending ${calls.length} transaction(s) for automatic deposit...`);

        // Send transactions sequentially through Scroll smart account
        let transactionHash;
        if (calls.length === 1) {
          // Only deposit needed
          transactionHash = await scrollSmartAccount.sendTransaction(calls[0]);
        } else {
          // Send approve first, then deposit
          console.log("Sending approval transaction...");
          const approveHash = await scrollSmartAccount.sendTransaction(calls[0]);
          console.log("Approval transaction hash:", approveHash);
          
          console.log("Sending deposit transaction...");
          transactionHash = await scrollSmartAccount.sendTransaction(calls[1]);
        }

        console.log("Automatic deposit transaction hash:", transactionHash);

        // Refresh user info after successful deposit
        setTimeout(async () => {
          await refreshUserInfo();
        }, 5000);

        return {
          success: true,
          transactionHash: transactionHash,
        };
      } catch (error) {
        console.error("Error in automatic deposit after bridge:", error);
        return {
          success: false,
        };
      }
    },
    [scrollSmartAccount, smartAccountAddress, refreshUserInfo]
  );

  const transferWalletToVault = useCallback(
    async (
      amount: number | undefined
    ): Promise<
      | { success: boolean; transactionHash?: string; crossChain?: boolean }
      | undefined
    > => {
      if (!amount || !scrollSmartAccount || !smartAccountAddress) {
        console.error("Missing amount, Scroll smart account not initialized");
        return;
      }

      try {
        console.log(`Depositing ${amount} USDC to Virtual Vault...`);

        // Get Scroll chain config for contract calls
        const scrollConfig = getChainConfig("scroll");
        
        // Create USDC contract instance for checking balance on Scroll
        const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
        const usdcContract = new ethers.Contract(
          scrollConfig.tokens.usdc,
          ERC20_ABI,
          provider
        );

        // Check Scroll USDC balance
        const scrollBalance = await usdcContract.balanceOf(smartAccountAddress);
        const scrollBalanceFormatted = parseFloat(formatUnits(scrollBalance, 6));
        console.log(`Scroll USDC balance: ${scrollBalanceFormatted}`);

        // If insufficient Scroll balance, check Base balance and use cross-chain
        if (scrollBalanceFormatted < amount) {
          console.log(`Insufficient Scroll balance (${scrollBalanceFormatted}). Checking Base balance...`);
          
          if (!baseSmartAccount) {
            throw new Error("Base smart account not available for cross-chain deposit");
          }

          const baseBalance = await checkBaseBalance();
          console.log(`Base USDC balance: ${baseBalance}`);

          // Declare variables that will be set below
          let bridgeAmount: number;
          let expectedBridgeOutput: number;
          let vaultDepositMessage: string;
          let acrossQuote: any;
          let isMaxDeposit: boolean;
          
          // Check if this is a max deposit
          isMaxDeposit = await getMaxDepositableAmount().then(max => Math.abs(amount - max) < 0.0001);
          
          // Always sweep all Base balance to minimize bridging operations
          // But only deposit the specified amount
          console.log(`💰 Sweeping all Base balance (${baseBalance} USDC) to Scroll...`);
          
          // Generate message for depositing exactly the requested amount
          const depositAmount = parseUnits(amount.toString(), 6).toString();
          vaultDepositMessage = generateVaultDepositMessage(depositAmount);
          
          // Get quote for sweeping all Base balance but only depositing the requested amount
          bridgeAmount = baseBalance;
          const sweepOutputAmount = parseUnits(baseBalance.toString(), 6).toString();
          
          acrossQuote = await getAcrossQuote(baseBalance, vaultDepositMessage);
          expectedBridgeOutput = parseFloat(formatUnits(acrossQuote.outputAmount, 6));
          const totalAfterSweep = scrollBalanceFormatted + expectedBridgeOutput;
          
          // For deposit tracking, we'll use the expected output if this is a max deposit
          // Otherwise, we'll use the exact requested amount
          const depositTrackingAmount = isMaxDeposit ? totalAfterSweep : amount;
          
          // Check if we'll have enough after sweeping all
          if (totalAfterSweep < amount) {
            throw new Error(`Insufficient balance even after sweeping all Base funds. Max depositable: ${totalAfterSweep.toFixed(6)} USDC (Scroll: ${scrollBalanceFormatted} + Sweep output: ${expectedBridgeOutput})`);
          }

          // Perform cross-chain bridge from Base to Scroll
          console.log(`🌉 Bridging ${bridgeAmount} USDC from Base to Scroll and preparing deposit...`);
          
          const baseConfig = getChainConfig("base");
          const inputAmount = parseUnits(bridgeAmount.toString(), 6);

          // Use the quote we already calculated
          const outputAmount = BigInt(acrossQuote.outputAmount);
          const finalVaultDepositMessage = vaultDepositMessage;

          // Prepare Base chain transactions (approval + bridge)
          const baseCalls = [];
          
          // Check and handle USDC approval for Across SpokePool
          const baseProvider = new ethers.JsonRpcProvider(baseConfig.rpcUrl);
          const baseUsdcContract = new ethers.Contract(
            baseConfig.tokens.usdc,
            ERC20_ABI,
            baseProvider
          );

          const currentAllowance = await baseUsdcContract.allowance(
            smartAccountAddress,
            ACROSS_SPOKE_POOL_ADDRESSES.base
          );

          if (currentAllowance < inputAmount) {
            console.log("🔓 Adding USDC approval for Across SpokePool...");
            const usdcInterface = new ethers.Interface(ERC20_ABI);
            const approveCalldata = usdcInterface.encodeFunctionData("approve", [
              ACROSS_SPOKE_POOL_ADDRESSES.base,
              parseUnits("1000000", 6), // Approve large amount
            ]);

            baseCalls.push({
              to: baseConfig.tokens.usdc,
              data: approveCalldata,
            });
          }

          // Create Across bridge transaction with multicall handler
          const acrossInterface = new ethers.Interface(ACROSS_SPOKE_POOL_ABI);
          const bridgeCalldata = acrossInterface.encodeFunctionData("depositV3", [
            smartAccountAddress, // depositor
            ACROSS_MULTICALL_HANDLER_ADDRESSES.scroll, // recipient (multicall handler on Scroll)
            baseConfig.tokens.usdc, // inputToken (USDC on Base)
            scrollConfig.tokens.usdc, // outputToken (USDC on Scroll)
            inputAmount, // inputAmount (bridged amount)
            outputAmount, // outputAmount (from bridge quote)
            ACROSS_CHAIN_IDS.scroll, // destinationChainId
            ethers.ZeroAddress, // exclusiveRelayer (anyone can fill)
            acrossQuote.quoteTimestamp, // quoteTimestamp
            acrossQuote.fillDeadline, // fillDeadline
            acrossQuote.exclusivityParameter, // exclusivityParameter
            finalVaultDepositMessage // message (vault deposit instructions)
          ]);

          baseCalls.push({
            to: ACROSS_SPOKE_POOL_ADDRESSES.base,
            data: bridgeCalldata,
          });

          // Execute transactions on Base
          console.log(`🚀 Executing ${baseCalls.length} transaction(s) on Base...`);
          
          let bridgeHash: string;
          if (baseCalls.length === 1) {
            bridgeHash = await baseSmartAccount.sendTransaction(baseCalls[0]);
          } else {
            console.log("1️⃣ Sending USDC approval...");
            await baseSmartAccount.sendTransaction(baseCalls[0]);
            
            console.log("2️⃣ Sending bridge transaction...");
            bridgeHash = await baseSmartAccount.sendTransaction(baseCalls[1]);
          }

          console.log("✅ Cross-chain bridge with vault deposit initiated:", bridgeHash);
          console.log("💡 USDC will be bridged to Scroll and automatically deposited to vault!");

          // For direct vault deposit through Across protocol using the multicall handler,
          // funds should be auto-deposited when they arrive on Scroll
          // However, we'll set up an event listener and polling mechanism as a fallback to ensure deposit happens
          
          // expectedBridgeOutput is the amount that will arrive on Scroll
          console.log(`Expected output amount after bridge: ${expectedBridgeOutput} USDC`);
          console.log(`Amount to be deposited: ${amount} USDC`);
          
          // We'll check immediately if the funds are already there (uncommon but possible)
          const checkForFunds = async () => {
            try {
              // Check current Scroll USDC balance
              const scrollConfig = getChainConfig("scroll");
              const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
              const usdcContract = new ethers.Contract(
                scrollConfig.tokens.usdc,
                ERC20_ABI,
                provider
              );
              
              const scrollBalance = await usdcContract.balanceOf(smartAccountAddress);
              const scrollBalanceFormatted = parseFloat(formatUnits(scrollBalance, 6));
              
              console.log(`Current Scroll USDC balance: ${scrollBalanceFormatted}`);
              
              // If we detect funds have arrived on Scroll, initiate deposit
              if (scrollBalanceFormatted >= expectedBridgeOutput) {
                console.log(`Funds detected on Scroll! Initiating automatic deposit of ${amount} USDC`);
                
                // Always deposit the exact requested amount (or max if it's a max deposit)
                const depositResult = await depositAfterBridge(amount);
                
                if (depositResult?.success) {
                  console.log(`✅ Automatic deposit successful! Hash: ${depositResult.transactionHash}`);
                  
                  // Dispatch a custom event that the UI can listen for
                  if (typeof window !== 'undefined') {
                    const depositSuccessEvent = new CustomEvent('bridgeDepositSuccess', {
                      detail: {
                        amount: amount,
                        hash: depositResult.transactionHash
                      }
                    });
                    window.dispatchEvent(depositSuccessEvent);
                  }
                } else {
                  console.error("❌ Automatic deposit failed after bridge. User will need to deposit manually.");
                }
                
                // Refresh user info after the deposit attempt
                await refreshUserInfo();
                return true; // Funds found and deposit attempted
              }
              
              return false; // Funds not found yet
            } catch (error) {
              console.error("Error checking for bridged funds:", error);
              return false;
            }
          };
          
          // Make isMaxDeposit available for the polling mechanism
          const finalIsMaxDeposit = isMaxDeposit;
          
          // Start polling for funds arrival on Scroll if Across protocol doesn't auto-deposit
          // This is a fallback mechanism in case the automatic deposit via Across multicall handler fails
          const startPolling = async () => {
            // Check immediately first
            let fundsFound = false;
            
            try {
              // Check current Scroll USDC balance immediately
              const scrollConfig = getChainConfig("scroll");
              const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
              const usdcContract = new ethers.Contract(
                scrollConfig.tokens.usdc,
                ERC20_ABI,
                provider
              );
              
              const scrollBalance = await usdcContract.balanceOf(smartAccountAddress);
              const scrollBalanceFormatted = parseFloat(formatUnits(scrollBalance, 6));
              
              console.log(`Current Scroll USDC balance: ${scrollBalanceFormatted}`);
              
              // If we detect funds have arrived on Scroll, initiate deposit
              if (scrollBalanceFormatted >= expectedBridgeOutput) {
                console.log(`Funds detected on Scroll immediately! Initiating automatic deposit of ${finalIsMaxDeposit ? expectedBridgeOutput : amount} USDC`);
                
                // For max deposit, deposit all bridged funds
                // For specific amount, deposit the exact requested amount
                const amountToDeposit = finalIsMaxDeposit ? expectedBridgeOutput : amount;
                const depositResult = await depositAfterBridge(amountToDeposit);
                
                if (depositResult?.success) {
                  console.log(`✅ Automatic deposit successful! Hash: ${depositResult.transactionHash}`);
                  
                  // Dispatch a custom event that the UI can listen for
                  if (typeof window !== 'undefined') {
                    const depositSuccessEvent = new CustomEvent('bridgeDepositSuccess', {
                      detail: {
                        amount: amount,
                        hash: depositResult.transactionHash
                      }
                    });
                    window.dispatchEvent(depositSuccessEvent);
                  }
                } else {
                  console.error("❌ Automatic deposit failed after bridge. User will need to deposit manually.");
                }
                
                // Refresh user info after the deposit attempt
                await refreshUserInfo();
                fundsFound = true; // Funds found and deposit attempted
              }
            } catch (error) {
              console.error("Error checking for bridged funds immediately:", error);
            }
            
            if (fundsFound) return; // If funds already arrived, no need to poll
            
            let pollCount = 0;
            const maxPolls = 20; // Poll for up to ~10 minutes (20 * 30s = 10m)
            const pollInterval = 15000; // 15 seconds between polls (reduced from 30s)
            
            // Move provider and contract initialization outside the polling loop
            const scrollConfig = getChainConfig("scroll");
            const provider = new ethers.JsonRpcProvider(scrollConfig.rpcUrl);
            const usdcContract = new ethers.Contract(
              scrollConfig.tokens.usdc,
              ERC20_ABI,
              provider
            );
            
            const checkInterval = setInterval(async () => {
              pollCount++;
              console.log(`Polling for bridged funds (${pollCount}/${maxPolls})...`);
              
              try {
                // Use the existing provider and contract instances
                
                const scrollBalance = await usdcContract.balanceOf(smartAccountAddress);
                const scrollBalanceFormatted = parseFloat(formatUnits(scrollBalance, 6));
                
                console.log(`Current Scroll USDC balance: ${scrollBalanceFormatted}`);
                
                // If we detect funds have arrived on Scroll, initiate deposit
                if (scrollBalanceFormatted >= expectedBridgeOutput) {
                  console.log(`Funds detected on Scroll! Initiating automatic deposit of ${amount} USDC`);
                  clearInterval(checkInterval);
                  
                  // Always deposit the exact requested amount
                  const depositResult = await depositAfterBridge(amount);
                  
                  if (depositResult?.success) {
                    console.log(`✅ Automatic deposit successful! Hash: ${depositResult.transactionHash}`);
                    
                    // Dispatch a custom event that the UI can listen for
                    if (typeof window !== 'undefined') {
                      const depositSuccessEvent = new CustomEvent('bridgeDepositSuccess', {
                        detail: {
                          amount: amount,
                          hash: depositResult.transactionHash
                        }
                      });
                      window.dispatchEvent(depositSuccessEvent);
                    }
                  } else {
                    console.error("❌ Automatic deposit failed after bridge. User will need to deposit manually.");
                  }
                  
                  // Refresh user info after the deposit attempt
                  await refreshUserInfo();
                  return;
                }
              } catch (error) {
                console.error("Error in polling for bridged funds:", error);
              }
              
              // Stop polling after max attempts
              if (pollCount >= maxPolls) {
                console.log("Max polling attempts reached. Stopping polls.");
                clearInterval(checkInterval);
              }
            }, pollInterval);
            
            return checkInterval;
          };
          
          // Start polling process
          startPolling();

          return {
            success: true,
            transactionHash: bridgeHash,
            crossChain: true,
          };
        }

        // Regular Scroll deposit flow (sufficient Scroll balance)
        console.log("📤 Depositing directly on Scroll...");
        
        const amountInWei = parseUnits(amount.toString(), 6);

        // Check current allowance for Virtual Vault
        const currentAllowance = await usdcContract.allowance(
          smartAccountAddress,
          virtualVaultAddress
        );
        console.log(`Current allowance: ${formatUnits(currentAllowance, 6)} USDC`);

        // Prepare transaction calls
        const calls = [];

        // Only approve if current allowance is less than the transfer amount
        if (currentAllowance < amountInWei) {
          console.log("Adding approval transaction to batch...");

          // Approve a large amount to avoid future approvals
          const largeAllowance = parseUnits("1000000", 6); // 1 million USDC

          // Create the USDC approve call data
          const usdcInterface = new ethers.Interface(ERC20_ABI);
          const approveCalldata = usdcInterface.encodeFunctionData("approve", [
            virtualVaultAddress,
            largeAllowance,
          ]);

          calls.push({
            to: scrollConfig.tokens.usdc,
            data: approveCalldata,
          });
        } else {
          console.log("Sufficient allowance already exists, skipping approval.");
        }

        // Create the virtual vault deposit call data
        const vaultInterface = new ethers.Interface(VIRTUAL_VAULT_ABI);
        const depositCalldata = vaultInterface.encodeFunctionData("deposit(uint256,address)", [
          amountInWei,
          smartAccountAddress,
        ]);

        calls.push({
          to: virtualVaultAddress,
          data: depositCalldata,
        });

        console.log(`Sending ${calls.length} transaction(s)...`);

        // Send transactions sequentially through Scroll smart account
        let transactionHash;
        if (calls.length === 1) {
          // Only deposit needed
          transactionHash = await scrollSmartAccount.sendTransaction(calls[0]);
        } else {
          // Send approve first, then deposit
          console.log("Sending approval transaction...");
          const approveHash = await scrollSmartAccount.sendTransaction(calls[0]);
          console.log("Approval transaction hash:", approveHash);
          
          console.log("Sending deposit transaction...");
          transactionHash = await scrollSmartAccount.sendTransaction(calls[1]);
        }

        console.log("Transaction hash:", transactionHash);

        // Refresh user info after successful deposit
        setTimeout(async () => {
          await refreshUserInfo();
        }, 5000);

        return {
          success: true,
          transactionHash: transactionHash,
          crossChain: false,
        };
      } catch (error) {
        console.error("Error depositing to Virtual Vault:", error);
        throw error;
      }
    },
    [scrollSmartAccount, baseSmartAccount, smartAccountAddress, refreshUserInfo, checkBaseBalance, getAcrossQuote, generateVaultDepositMessage, depositAfterBridge]
  );

  const transferVaultToWallet = useCallback(
    async (
      amount: number | undefined
    ): Promise<{ success: boolean; withdrawHash?: string } | undefined> => {
      if (!amount || !scrollSmartAccount || !smartAccountAddress || !userData) {
        console.error("Missing amount, Scroll smart account not initialized, or user data unavailable");
        return;
      }

      try {
        console.log(`Smart withdrawal: ${amount} USDC requested`);

        // Get current vault balances
        const virtualVaultBalance = parseFloat(userData.virtualVault.withdrawableUsdc);
        const combinedVaultBalance = parseFloat(userData.combinedVault.withdrawableUsdc);
        const totalAvailable = virtualVaultBalance + combinedVaultBalance;

        console.log(`Available: VV=${virtualVaultBalance}, CV=${combinedVaultBalance}, Total=${totalAvailable}`);

        if (amount > totalAvailable) {
          throw new Error(`Insufficient balance. Requested: ${amount}, Available: ${totalAvailable}`);
        }

        // Determine withdrawal strategy
        const transactions = [];
        let amountFromVV = 0;
        let amountFromCV = 0;

        if (amount <= virtualVaultBalance) {
          // Withdraw everything from Virtual Vault
          amountFromVV = amount;
          console.log(`Strategy: Withdraw ${amountFromVV} from Virtual Vault only`);
        } else {
          // Withdraw all from Virtual Vault, remainder from Combined Vault
          amountFromVV = virtualVaultBalance;
          amountFromCV = amount - virtualVaultBalance;
          console.log(`Strategy: Withdraw ${amountFromVV} from VV, ${amountFromCV} from CV`);
        }

        // Helper function to round to 6 decimal places (USDC precision)
        const roundTo6Decimals = (num: number): number => {
          return Math.round(num * 1000000) / 1000000;
        };

        // Prepare withdrawal transactions
        if (amountFromVV > 0) {
          const roundedVVAmount = roundTo6Decimals(amountFromVV);
          const vvAmountInWei = parseUnits(roundedVVAmount.toFixed(6), 6);
          const vvInterface = new ethers.Interface(VIRTUAL_VAULT_ABI);
          const vvWithdrawCalldata = vvInterface.encodeFunctionData("withdraw(uint256,address,address)", [
            vvAmountInWei,
            smartAccountAddress,
            smartAccountAddress,
          ]);

          transactions.push({
            vault: "Virtual Vault",
            amount: roundedVVAmount,
            to: virtualVaultAddress,
            data: vvWithdrawCalldata,
          });
        }

        if (amountFromCV > 0) {
          const roundedCVAmount = roundTo6Decimals(amountFromCV);
          const cvAmountInWei = parseUnits(roundedCVAmount.toFixed(6), 6);
          const cvInterface = new ethers.Interface(COMBINED_VAULT_ABI);
          const cvWithdrawCalldata = cvInterface.encodeFunctionData("withdraw(uint256,address,address)", [
            cvAmountInWei,
            smartAccountAddress,
            smartAccountAddress,
          ]);

          transactions.push({
            vault: "Combined Vault",
            amount: roundedCVAmount,
            to: combinedVaultAddress,
            data: cvWithdrawCalldata,
          });
        }

        // Execute withdrawal transactions sequentially
        let finalTransactionHash = "";
        for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];
          console.log(`Executing withdrawal ${i + 1}/${transactions.length}: ${tx.amount} from ${tx.vault}`);
          
          const txHash = await scrollSmartAccount.sendTransaction({
            to: tx.to,
            data: tx.data,
          });
          
          console.log(`${tx.vault} withdrawal hash: ${txHash}`);
          finalTransactionHash = txHash; // Keep the last transaction hash
        }

        console.log(`Smart withdrawal completed. Final hash: ${finalTransactionHash}`);

        // Refresh user info after successful withdrawal
        setTimeout(async () => {
          await refreshUserInfo();
        }, 5000);

        return {
          success: true,
          withdrawHash: finalTransactionHash,
        };
      } catch (error) {
        console.error("Error in smart withdrawal:", error);
        throw error;
      }
    },
    [scrollSmartAccount, smartAccountAddress, refreshUserInfo, userData]
  );

  const value = {
    transferWalletToVault,
    transferVaultToWallet,
    getMaxDepositableAmount,
    depositAfterBridge,
  };

  return (
    <MainnetTransactionContext.Provider value={value}>
      {children}
    </MainnetTransactionContext.Provider>
  );
}

export function useMainnetTransaction(): MainnetTransactionContextType {
  const context = useContext(MainnetTransactionContext);
  if (context === undefined) {
    throw new Error("useMainnetTransaction must be used within a MainnetTransactionProvider");
  }
  return context;
}