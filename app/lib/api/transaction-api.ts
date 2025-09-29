'use client';

import { createPublicClient, http, parseUnits, formatUnits, encodeFunctionData } from "viem";
import { ethers } from "ethers";
import { getActiveChainConfigs, getChainConfig, type SupportedChainKey } from "../config/chains";
import { getVaultConfig, getActiveVaults, type VaultConfig } from "../config/vaults";
import { Transaction, TransactionApiInterface, MultiChainWalletData, TransactionType } from "../types";
import { ERC20_ABI, ACROSS_SPOKE_POOL_ABI, COMBINED_VAULT_ABI, VIRTUAL_VAULT_ABI, WETH_ABI } from "../abis";
import { walletAPI } from "./wallet-api";
import { userAPI } from "./user-api";
import { odosAPI } from './odos-api';
import { getSecureTransactionHistory } from "../utils/secure-api";

const ACROSS_API_URL = 'https://app.across.to/api/suggested-fees';

class TransactionAPI implements TransactionApiInterface {
    private static instance: TransactionAPI;
    private publicClient: any;
    private SCROLLSCAN_API_URL = 'https://api.scrollscan.com/api';
    private SCROLLSCAN_API_KEY = process.env.NEXT_PUBLIC_SCROLLSCAN_API_KEY;
    private BASESCAN_API_URL = 'https://api.basescan.org/api';
    private BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY;
    private OPTIMISM_API_URL = 'https://api-optimistic.etherscan.io/api';
    private OPTIMISM_API_KEY = process.env.NEXT_PUBLIC_OPTIMISM_API_KEY;
    private ARBITRUM_API_URL = 'https://api.arbiscan.io/api';
    private ARBITRUM_API_KEY = process.env.NEXT_PUBLIC_ARBITRUM_API_KEY;
    private POLYGONSCAN_API_URL = 'https://api.polygonscan.com/api';
    private POLYGONSCAN_API_KEY = process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY;

    // Method signatures from CombinedVault.sol
    private readonly METHOD_SIGNATURES = {
        DEPOSIT: '0x6e553f65',      // deposit(address,uint256)
        WITHDRAW: '0x2e1a7d4d',     // withdraw(uint256,address,address)
        ACCRUE: '0x3d18b912',       // accrueAndFlush()
    };

    // Hardcoded addresses
    private readonly VAULT_ADDRESSES: Record<string, string> = {
        '0x921bE808782590115c675CDA86B3aB61b55B502c': 'Stable Yield Vault',
        '0x11C8D7894A582199CBf400dabFe0Be2fC3BB3176': 'Stable Yield Vault',
    };

    private readonly CRON_ADDRESS = '0x0000000000000000000000000000000000000001'; // Placeholder since we don't have the real address

    // Add these constants to transaction-api.ts (similar to MainnetTransactionProvider)
    private readonly ACROSS_SPOKE_POOL_ADDRESSES = {
        base: "0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64",
        scroll: "0x3bad7ad0728f9917d1bf08af5782dcbd516cdd96",
        optimism: "0x6f26Bf09B1C792e3228e5467807a900A503c0281",
        arbitrum: "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A",
        polygon: "0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096",
        scrollSepolia: "", // Not used for Sepolia
    } as const;

    private readonly ACROSS_MULTICALL_HANDLER_ADDRESSES = {
        scroll: "0x924a9f036260DdD5808007E1AA95f08eD08aA569",
    } as const;

    private readonly SUPPORTED_BRIDGE_ROUTES: Array<[SupportedChainKey, SupportedChainKey]> = [
        ['base', 'scroll'],
        ['optimism', 'scroll'],
        ['arbitrum', 'scroll'],
        ['polygon', 'scroll']
    ];

    private readonly ACROSS_CHAIN_IDS = {
        base: 8453,
        scroll: 534352,
        optimism: 10,
        arbitrum: 42161,
        polygon: 137,
    } as const;

    constructor() {
        // Use the first active chain for transaction queries
        const chainConfig = getActiveChainConfigs()[0];
        this.publicClient = createPublicClient({
            chain: chainConfig.chain,
            transport: chainConfig.secureTransport, // Use secure transport
        });
    }

    static getInstance(): TransactionAPI {
        if (!TransactionAPI.instance) {
            TransactionAPI.instance = new TransactionAPI();
        }
        return TransactionAPI.instance;
    }

    // Helper method to check if a bridge route is supported
    private isBridgeRouteSupported(fromChain: SupportedChainKey, toChain: SupportedChainKey): boolean {
        return this.SUPPORTED_BRIDGE_ROUTES.some(
            ([from, to]) => from === fromChain && to === toChain
        );
    }

    // Helper method to wrap ETH to WETH
    private async wrapEthToWeth(
        chainKey: SupportedChainKey,
        amount: string,
        smartAccount: any
    ): Promise<string> {
        const chainConfig = getChainConfig(chainKey);
        const wethAddress = chainConfig.tokens.weth;

        if (!wethAddress) {
            throw new Error(`WETH not supported on ${chainKey}`);
        }

        const amountInWei = parseUnits(amount, 18);

        const wrapCalldata = encodeFunctionData({
            abi: WETH_ABI,
            functionName: "deposit",
            args: [],
        });

        console.log(`💱 Wrapping ${amount} ETH to WETH on ${chainKey}...`);

        const wrapHash = await smartAccount.sendTransaction({
            to: wethAddress,
            data: wrapCalldata,
            value: amountInWei, // Send ETH to wrap it
        });

        console.log(`✅ ETH wrapped to WETH: ${wrapHash}`);
        return wrapHash;
    }

    // Helper method to get ETH bridge quote and handle amount validation
    private async getEthBridgeQuote(
        fromChainConfig: any,
        toChainConfig: any,
        wethAddress: string,
        outputWethAddress: string,
        amountInWei: bigint,
        finalRecipient: string
    ): Promise<any> {
        const params = new URLSearchParams({
            inputToken: wethAddress,
            outputToken: outputWethAddress,
            amount: amountInWei.toString(),
            originChainId: fromChainConfig.chain.id.toString(),
            destinationChainId: toChainConfig.chain.id.toString(),
            recipient: finalRecipient as string,
            message: "0x",
        });

        const response = await fetch(`${ACROSS_API_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Across API error response:", errorText);

            // Try to parse the error response as JSON
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.code === "AMOUNT_TOO_LOW") {
                    throw new Error(`Bridge amount too low: ${(Number(amountInWei) / 1e18).toFixed(6)} ETH is too small relative to bridge fees. Consider withdrawing a larger amount or use funds already on the destination chain.`);
                }
                throw new Error(`Across API error: ${errorData.message || errorText}`);
            } catch (parseError) {
                // If JSON parsing fails, use the raw error text
                if (errorText.includes("AMOUNT_TOO_LOW")) {
                    throw new Error(`Bridge amount too low: ${(Number(amountInWei) / 1e18).toFixed(6)} ETH is too small relative to bridge fees. Consider withdrawing a larger amount or use funds already on the destination chain.`);
                }
                throw new Error(`Across API error: ${response.status} - ${errorText}`);
            }
        }

        return await response.json();
    }

    // Helper method to validate all ETH bridge amounts before proceeding
    private async validateEthBridgeAmounts(
        bridgePlans: Array<{ chain: SupportedChainKey; amount: number }>,
        multiChainWalletData: MultiChainWalletData,
        recipientAddress?: `0x${string}`
    ): Promise<{ validPlans: Array<{ chain: SupportedChainKey; amount: number }>; invalidPlans: Array<{ chain: SupportedChainKey; amount: number; error: string }> }> {
        const toChainConfig = getChainConfig('scroll');
        const toChainData = multiChainWalletData['scroll'];
        const finalRecipient = recipientAddress || toChainData.smartAccountAddress;

        if (!finalRecipient) {
            throw new Error('Recipient address is required for ETH bridging validation');
        }

        const validPlans: Array<{ chain: SupportedChainKey; amount: number }> = [];
        const invalidPlans: Array<{ chain: SupportedChainKey; amount: number; error: string }> = [];

        console.log(`🔍 Validating ${bridgePlans.length} ETH bridge amounts...`);

        // Validate each bridge plan
        for (const plan of bridgePlans) {
            const fromChainConfig = getChainConfig(plan.chain);
            const wethAddress = fromChainConfig.tokens.weth;
            const outputWethAddress = toChainConfig.tokens.weth;

            if (!wethAddress || !outputWethAddress) {
                invalidPlans.push({
                    ...plan,
                    error: `WETH not supported on ${plan.chain} or scroll`
                });
                continue;
            }

            const amountInWei = parseUnits(plan.amount.toString(), 18);

            try {
                // Just check if we can get a quote without errors
                await this.getEthBridgeQuote(
                    fromChainConfig,
                    toChainConfig,
                    wethAddress,
                    outputWethAddress,
                    amountInWei,
                    finalRecipient
                );

                validPlans.push(plan);
                console.log(`✅ [${plan.chain}] ${plan.amount} ETH bridge amount is valid`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                invalidPlans.push({
                    ...plan,
                    error: errorMessage
                });
                console.log(`❌ [${plan.chain}] ${plan.amount} ETH bridge amount is invalid: ${errorMessage}`);
            }
        }

        return { validPlans, invalidPlans };
    }

    // Helper method to unwrap WETH to ETH
    private async unwrapWethToEth(
        chainKey: SupportedChainKey,
        amount: string,
        smartAccount: any
    ): Promise<string> {
        const chainConfig = getChainConfig(chainKey);
        const wethAddress = chainConfig.tokens.weth;

        if (!wethAddress) {
            throw new Error(`WETH not supported on ${chainKey}`);
        }

        const amountInWei = parseUnits(amount, 18);

        const unwrapCalldata = encodeFunctionData({
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [amountInWei],
        });

        console.log(`💱 Unwrapping ${amount} WETH to ETH on ${chainKey}...`);

        const unwrapHash = await smartAccount.sendTransaction({
            to: wethAddress,
            data: unwrapCalldata,
        });

        console.log(`✅ WETH unwrapped to ETH: ${unwrapHash}`);
        return unwrapHash;
    }

    // Helper method to bridge ETH (via WETH)
    private async bridgeEthViaWeth(
        fromChainKey: SupportedChainKey,
        toChainKey: SupportedChainKey,
        amount: string,
        multiChainWalletData: MultiChainWalletData,
        recipientAddress?: `0x${string}`
    ): Promise<{ wrapTx: string; bridgeTx: string }> {
        const fromChainData = multiChainWalletData[fromChainKey];
        const toChainData = multiChainWalletData[toChainKey];
        const fromChainConfig = getChainConfig(fromChainKey);
        const toChainConfig = getChainConfig(toChainKey);

        const wethAddress = fromChainConfig.tokens.weth;
        const outputWethAddress = toChainConfig.tokens.weth;

        if (!wethAddress || !outputWethAddress) {
            throw new Error(`WETH not supported on ${fromChainKey} or ${toChainKey}`);
        }

        const finalRecipient = recipientAddress || toChainData.smartAccountAddress;
        if (!finalRecipient) {
            throw new Error('Recipient address is required for ETH bridging');
        }

        const amountInWei = parseUnits(amount, 18);

        // Step 1: Check if amount is sufficient for bridging BEFORE wrapping
        console.log(`🔍 Checking if ${amount} ETH is sufficient for bridging from ${fromChainKey} to ${toChainKey}...`);

        const quote = await this.getEthBridgeQuote(
            fromChainConfig,
            toChainConfig,
            wethAddress,
            outputWethAddress,
            amountInWei,
            finalRecipient
        );

        // Step 2: Only wrap ETH to WETH if quote is successful
        console.log(`✅ Amount is sufficient for bridging. Proceeding with ETH wrapping...`);
        const wrapTx = await this.wrapEthToWeth(fromChainKey, amount, fromChainData.smartAccount);

        // Step 3: Check and handle WETH approval for Across SpokePool
        const spokePoolAddress = this.ACROSS_SPOKE_POOL_ADDRESSES[fromChainKey];
        if (!spokePoolAddress) {
            throw new Error(`Spoke pool address not found for ${fromChainKey}`);
        }

        const allowanceClient = createPublicClient({
            chain: fromChainConfig.chain,
            transport: fromChainConfig.secureTransport
        });

        const currentAllowance = await allowanceClient.readContract({
            address: wethAddress,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [fromChainData.smartAccountAddress as `0x${string}`, spokePoolAddress as `0x${string}`],
        }) as bigint;

        if (currentAllowance < amountInWei) {
            console.log("🔓 Adding WETH approval for Across SpokePool...");
            const approveCalldata = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: "approve",
                args: [spokePoolAddress as `0x${string}`, parseUnits("1000000", 18)], // Approve large amount
            });

            await fromChainData.smartAccount.sendTransaction({
                to: wethAddress,
                data: approveCalldata,
            });
        }

        // Step 4: Bridge WETH using Across
        const bridgeCalldata = encodeFunctionData({
            abi: ACROSS_SPOKE_POOL_ABI,
            functionName: "depositV3",
            args: [
                fromChainData.smartAccountAddress as `0x${string}`,
                finalRecipient as `0x${string}`,
                wethAddress, // WETH address as input token
                outputWethAddress, // WETH address as output token  
                amountInWei,
                BigInt(quote.outputAmount),
                BigInt(toChainConfig.chain.id),
                "0x0000000000000000000000000000000000000000" as `0x${string}`,
                quote.timestamp,
                quote.fillDeadline || Math.floor(Date.now() / 1000) + 7200,
                quote.exclusivityParameter || 0,
                "0x" as `0x${string}`
            ],
        });

        console.log(`🌉 Bridging WETH from ${fromChainKey} to ${toChainKey}...`);

        const bridgeTx = await fromChainData.smartAccount.sendTransaction({
            to: spokePoolAddress,
            data: bridgeCalldata,
        });

        console.log(`✅ WETH bridge completed: ${bridgeTx}`);
        console.log(`💡 ${amount} ETH (as WETH) bridged from ${fromChainKey} to ${toChainKey}`);
        console.log(`🔄 WETH will be automatically unwrapped to native ETH once it arrives`);

        return { wrapTx, bridgeTx };
    }

    // New method to transfer between chains using Across Protocol
    async transferBetweenChains(
        fromChainKey: SupportedChainKey,
        toChainKey: SupportedChainKey,
        tokenSymbol: string,
        amount: string,
        multiChainWalletData: MultiChainWalletData,
        recipientAddress?: `0x${string}` // Optional recipient for direct transfers
    ): Promise<string> {
        try {
            console.log(`🌉 Bridging ${amount} ${tokenSymbol} from ${fromChainKey} to ${toChainKey} using Across Protocol`);

            const fromChainData = multiChainWalletData[fromChainKey];
            const toChainData = multiChainWalletData[toChainKey];

            if (!fromChainData?.smartAccount || !toChainData?.smartAccountAddress) {
                throw new Error(`Smart accounts not available for cross-chain transfer`);
            }

            // Check if bridge route is supported
            if (!this.isBridgeRouteSupported(fromChainKey, toChainKey)) {
                throw new Error(`Bridge route from ${fromChainKey} to ${toChainKey} is not supported`);
            }

            const fromChainConfig = getChainConfig(fromChainKey);
            const toChainConfig = getChainConfig(toChainKey);

            // Handle ETH differently as it's a native token
            let tokenAddress: `0x${string}`;
            let decimals: number;
            let amountInWei: bigint;

            // Use provided recipient or default to destination smart account
            const finalRecipient = recipientAddress || toChainData.smartAccountAddress;

            // Check and handle token approval for Across SpokePool
            const spokePoolAddress = this.ACROSS_SPOKE_POOL_ADDRESSES[fromChainKey];
            if (!spokePoolAddress) {
                throw new Error(`Spoke pool address not found for ${fromChainKey}`);
            }

            if (tokenSymbol.toLowerCase() === 'eth') {
                // Handle ETH bridging via WETH wrapping with improved error handling
                try {
                    const { wrapTx, bridgeTx } = await this.bridgeEthViaWeth(
                        fromChainKey,
                        toChainKey,
                        amount,
                        multiChainWalletData,
                        recipientAddress
                    );

                    // Return the bridge transaction hash (could also return both)
                    return bridgeTx;
                } catch (error) {
                    // Provide more specific error messages for ETH bridging
                    if (error instanceof Error) {
                        if (error.message.includes("Bridge amount too low")) {
                            throw new Error(`❌ ETH Bridge Amount Too Low\n\nThe amount ${amount} ETH is too small for cross-chain bridging due to bridge fees being higher than the transfer amount.\n\n💡 Solutions:\n• Withdraw a larger amount (recommended: >0.005 ETH)\n• Use ETH that's already available on Scroll\n• Consider withdrawing a different token like USDC`);
                        }
                        if (error.message.includes("WETH not supported")) {
                            throw new Error(`❌ ETH Bridging Not Available\n\nETH bridging from ${fromChainKey} to ${toChainKey} is not currently supported.\n\n💡 Try withdrawing ETH directly from Scroll instead.`);
                        }
                    }
                    // Re-throw the original error if it's not a known case
                    throw error;
                }

            } else {
                // Handle ERC-20 tokens (USDC, USDT)
                const tokenAddr = fromChainConfig.tokens[tokenSymbol.toLowerCase() as keyof typeof fromChainConfig.tokens];

                if (!tokenAddr) {
                    throw new Error(`Token ${tokenSymbol} not supported on ${fromChainKey}`);
                }

                tokenAddress = tokenAddr;

                // Get token decimals and convert amount
                const publicClient = createPublicClient({
                    chain: fromChainConfig.chain,
                    transport: fromChainConfig.secureTransport
                });

                const decimalsResult = await publicClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "decimals",
                });

                decimals = decimalsResult as number;
                amountInWei = parseUnits(amount, decimals);

                // Get Across quote - use the same token address for input and output
                const outputTokenAddress = toChainConfig.tokens[tokenSymbol.toLowerCase() as keyof typeof toChainConfig.tokens];
                if (!outputTokenAddress) {
                    throw new Error(`Token ${tokenSymbol} not supported on destination chain ${toChainKey}`);
                }

                const params = new URLSearchParams({
                    inputToken: tokenAddress,
                    outputToken: outputTokenAddress,
                    amount: amountInWei.toString(),
                    originChainId: fromChainConfig.chain.id.toString(),
                    destinationChainId: toChainConfig.chain.id.toString(),
                    recipient: finalRecipient,
                    message: "0x", // No message for simple transfer
                });

                const response = await fetch(
                    `${ACROSS_API_URL}?${params.toString()}`
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Across API error response:", errorText);

                    // Try to parse the error response as JSON
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.code === "AMOUNT_TOO_LOW") {
                            throw new Error(`Bridge amount too low: ${amount} ${tokenSymbol} is too small relative to bridge fees`);
                        }
                        throw new Error(`Across API error: ${errorData.message || errorText}`);
                    } catch (parseError) {
                        // If JSON parsing fails, use the raw error text
                        if (errorText.includes("AMOUNT_TOO_LOW")) {
                            throw new Error(`Bridge amount too low: ${amount} ${tokenSymbol} is too small relative to bridge fees`);
                        }
                        throw new Error(`Across API error: ${response.status} - ${errorText}`);
                    }
                }

                const quote = await response.json();

                // Prepare transactions
                const calls = [];

                // Re-create publicClient for allowance check
                const allowanceClient = createPublicClient({
                    chain: fromChainConfig.chain,
                    transport: fromChainConfig.secureTransport
                });

                const currentAllowance = await allowanceClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "allowance",
                    args: [fromChainData.smartAccountAddress as `0x${string}`, spokePoolAddress as `0x${string}`],
                }) as bigint;

                if (currentAllowance < amountInWei) {
                    console.log("🔓 Adding token approval for Across SpokePool...");
                    const approveCalldata = encodeFunctionData({
                        abi: ERC20_ABI,
                        functionName: "approve",
                        args: [spokePoolAddress as `0x${string}`, parseUnits("1000000", decimals as number)], // Approve large amount
                    });

                    calls.push({
                        to: tokenAddress,
                        data: approveCalldata,
                    });
                }

                // Create Across bridge transaction
                const bridgeCalldata = encodeFunctionData({
                    abi: ACROSS_SPOKE_POOL_ABI,
                    functionName: "depositV3",
                    args: [
                        fromChainData.smartAccountAddress as `0x${string}`, // depositor
                        finalRecipient as `0x${string}`, // recipient (EOA or destination SA)
                        tokenAddress, // inputToken
                        outputTokenAddress, // outputToken
                        amountInWei, // inputAmount
                        BigInt(quote.outputAmount), // outputAmount
                        BigInt(toChainConfig.chain.id), // destinationChainId
                        "0x0000000000000000000000000000000000000000" as `0x${string}`, // exclusiveRelayer (anyone can fill)
                        quote.timestamp, // quoteTimestamp
                        quote.fillDeadline || Math.floor(Date.now() / 1000) + 7200, // fillDeadline
                        quote.exclusivityParameter || 0, // exclusivityParameter
                        "0x" as `0x${string}` // message (empty for simple transfer)
                    ],
                });

                calls.push({
                    to: spokePoolAddress,
                    data: bridgeCalldata,
                });

                // Execute transactions
                console.log(`🚀 Executing ${calls.length} transaction(s) on ${fromChainKey}...`);

                let bridgeHash: string;
                if (calls.length === 1) {
                    bridgeHash = await fromChainData.smartAccount.sendTransaction(calls[0]);
                } else {
                    console.log("1️⃣ Sending token approval...");
                    await fromChainData.smartAccount.sendTransaction(calls[0]);

                    console.log("2️⃣ Sending bridge transaction...");
                    bridgeHash = await fromChainData.smartAccount.sendTransaction(calls[1]);
                }

                console.log(`✅ Cross-chain bridge completed: ${bridgeHash}`);
                console.log(`💡 ${amount} ${tokenSymbol} bridged from ${fromChainKey} to ${toChainKey}`);

                return bridgeHash;
            }
        } catch (error) {
            console.error("Error in cross-chain transfer:", error);

            // Check if this is an "amount too low" error from Across
            if (error instanceof Error && error.message.includes("AMOUNT_TOO_LOW")) {
                throw new Error(`Bridge amount too low: The amount to bridge (${amount} ${tokenSymbol}) is too small relative to bridge fees. Consider withdrawing a larger amount or use funds already on Scroll.`);
            }

            throw error;
        }
    }

    private async getAllChainBalances(tokenSymbol: string): Promise<{ chain: SupportedChainKey; balance: number }[]> {
        const chains: SupportedChainKey[] = ['base', 'scroll', 'optimism', 'arbitrum', 'polygon'];
        const balances = await Promise.all(
            chains.map(async (chain) => {
                try {
                    const balance = await walletAPI.getTokenBalance(chain, tokenSymbol);
                    return { chain, balance: parseFloat(balance) };
                } catch (error) {
                    console.error(`Error getting ${chain} balance:`, error);
                    return { chain, balance: 0 };
                }
            })
        );

        return balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    }

    // New method to withdraw tokens to EOA with optimized bridging
    async withdrawToEOA(
        tokenSymbol: string,
        amount: string,
        recipientAddress: `0x${string}`,
        multiChainWalletData: MultiChainWalletData
    ): Promise<{ consolidationTxs: string[]; withdrawalTx: string }> {
        try {
            console.log(`Starting optimized withdrawal: ${amount} ${tokenSymbol} to ${recipientAddress}`);

            let requestedAmount = parseFloat(amount);
            const consolidationTxs: string[] = [];

            // Step 1: Get balances across all chains
            const allBalances = await this.getAllChainBalances(tokenSymbol);
            console.log('Chain balances:', allBalances);

            const scrollBalance = allBalances.find(b => b.chain === 'scroll')?.balance || 0;
            const otherChainBalances = allBalances.filter(b => b.chain !== 'scroll');
            const totalBalance = allBalances.reduce((sum, b) => sum + b.balance, 0);

            console.log(`Total balance across all chains: ${totalBalance} ${tokenSymbol}`);
            console.log(`Requested amount: ${amount} ${tokenSymbol}`);

            // Handle max withdrawal and floating point precision issues
            const tolerance = 0.000001; // Increased tolerance for better UX (1e-6)
            const isMaxWithdrawal = requestedAmount >= totalBalance * 0.99; // If requesting >99% of balance, treat as max

            if (totalBalance < requestedAmount - tolerance) {
                throw new Error(`Insufficient total balance. Available: ${totalBalance}, requested: ${requestedAmount}`);
            }

            // Auto-adjust to max available when close to total balance or within tolerance
            if (isMaxWithdrawal || (requestedAmount > totalBalance && requestedAmount <= totalBalance + tolerance)) {
                console.log(`⚖️  Adjusting withdrawal to max available: ${requestedAmount} → ${totalBalance}`);
                requestedAmount = totalBalance;
            }

            // Step 2: If Scroll has enough balance, proceed directly to withdrawal
            if (scrollBalance >= requestedAmount) {
                console.log(`✅ Scroll has sufficient balance, proceeding with direct withdrawal`);

                // Direct withdrawal from Scroll
                const scrollChainData = multiChainWalletData['scroll'];
                if (!scrollChainData?.smartAccount) {
                    throw new Error('Scroll smart account not available');
                }

                const withdrawalTx = await this.executeDirectWithdrawal(
                    scrollChainData.smartAccount,
                    tokenSymbol,
                    requestedAmount.toString(),
                    recipientAddress
                );

                console.log(`✅ Direct withdrawal completed: ${withdrawalTx}`);

                return {
                    consolidationTxs: [],
                    withdrawalTx
                };
            } else {
                // Step 3: Bridge from other chains to fulfill withdrawal
                console.log(`🌉 Using cross-chain bridges to fulfill withdrawal`);

                // First, withdraw available Scroll balance if any
                let scrollWithdrawalTx = "";
                if (scrollBalance > 0) {
                    console.log(`💰 First withdrawing ${scrollBalance} ${tokenSymbol} from Scroll`);

                    const scrollChainData = multiChainWalletData['scroll'];
                    if (!scrollChainData?.smartAccount) {
                        throw new Error('Scroll smart account not available');
                    }

                    scrollWithdrawalTx = await this.executeDirectWithdrawal(
                        scrollChainData.smartAccount,
                        tokenSymbol,
                        scrollBalance.toString(),
                        recipientAddress
                    );

                    console.log(`✅ Scroll withdrawal completed: ${scrollWithdrawalTx}`);
                }

                // Bridge remaining amount needed from other chains
                let remainingNeeded = requestedAmount - scrollBalance;

                // For ETH, validate all bridge amounts upfront before proceeding
                if (tokenSymbol.toLowerCase() === 'eth') {
                    console.log(`🔍 Pre-validating ETH bridge amounts for ${otherChainBalances.length} chains...`);

                    // Create bridge plans for all chains that need bridging
                    const bridgePlans: Array<{ chain: SupportedChainKey; amount: number }> = [];
                    let tempRemainingNeeded = remainingNeeded;

                    for (const { chain, balance } of otherChainBalances) {
                        if (tempRemainingNeeded <= 0 || balance <= 0) continue;

                        const bridgeAmount = Math.min(tempRemainingNeeded, balance);
                        bridgePlans.push({ chain, amount: bridgeAmount });
                        tempRemainingNeeded -= bridgeAmount;
                    }

                    if (bridgePlans.length > 0) {
                        const { validPlans, invalidPlans } = await this.validateEthBridgeAmounts(
                            bridgePlans,
                            multiChainWalletData,
                            recipientAddress
                        );

                        console.log(`📊 Validation results: ${validPlans.length} valid, ${invalidPlans.length} invalid bridge plans`);

                        // Check if valid plans can cover the remaining needed amount
                        const totalValidAmount = validPlans.reduce((sum, plan) => sum + plan.amount, 0);

                        if (totalValidAmount < remainingNeeded) {
                            const errorDetails = invalidPlans.length > 0
                                ? `\n\nInvalid bridge amounts:\n${invalidPlans.map(p => `• ${p.chain}: ${p.amount} ETH - ${p.error}`).join('\n')}`
                                : '';

                            throw new Error(`Insufficient valid bridge amounts for ETH withdrawal. Required: ${remainingNeeded.toFixed(6)} ETH, Valid bridge amounts available: ${totalValidAmount.toFixed(6)} ETH${errorDetails}`);
                        }

                        console.log(`✅ Validation passed: ${totalValidAmount.toFixed(6)} ETH available from valid bridge amounts (required: ${remainingNeeded.toFixed(6)} ETH)`);

                        // Log details of invalid plans for debugging
                        if (invalidPlans.length > 0) {
                            console.warn(`⚠️  Some bridge amounts were invalid but sufficient funds are available from other chains:`);
                            invalidPlans.forEach(plan => {
                                console.warn(`   • ${plan.chain}: ${plan.amount} ETH - ${plan.error}`);
                            });
                        }
                    }
                }

                // Process each chain with balance
                for (const { chain, balance } of otherChainBalances) {
                    if (remainingNeeded <= 0) break;

                    const bridgeAmount = Math.min(remainingNeeded, balance);

                    if (tokenSymbol.toLowerCase() === 'eth') {
                        console.log(`🌉 Bridging ${bridgeAmount} ${tokenSymbol} from ${chain} to smart account (will auto-unwrap to ETH)`);
                    } else {
                        console.log(`🌉 Bridging ${bridgeAmount} ${tokenSymbol} from ${chain} directly to recipient`);
                    }

                    try {
                        let bridgeTx: string;

                        if (tokenSymbol.toLowerCase() === 'eth') {
                            // For ETH, bridge WETH to smart account first, then poll and unwrap
                            bridgeTx = await this.transferBetweenChains(
                                chain,
                                'scroll',
                                tokenSymbol,
                                bridgeAmount.toString(),
                                multiChainWalletData
                                // Don't pass recipientAddress - bridge to smart account first
                            );
                        } else {
                            // For ERC-20 tokens, bridge directly to recipient
                            bridgeTx = await this.transferBetweenChains(
                                chain,
                                'scroll',
                                tokenSymbol,
                                bridgeAmount.toString(),
                                multiChainWalletData,
                                recipientAddress
                            );
                        }

                        consolidationTxs.push(bridgeTx);
                        remainingNeeded -= bridgeAmount;

                        console.log(`✅ [${chain}] Bridged ${bridgeAmount} ${tokenSymbol}. Remaining needed: ${remainingNeeded}`);

                    } catch (bridgeError) {
                        // Handle bridge-specific errors gracefully
                        if (bridgeError instanceof Error) {
                            if (bridgeError.message.includes("Bridge amount too low")) {
                                console.warn(`Skipping ${chain} - amount too low for bridging`);
                                continue; // Try next chain
                            }
                        }
                        throw bridgeError;
                    }
                }

                // Check if we still need more funds, with tolerance for floating point precision
                const tolerance = 1e-6; // Very small tolerance for floating point errors
                if (remainingNeeded > tolerance) {
                    console.error(`❌ Insufficient funds after all bridge attempts. Still need: ${remainingNeeded} ${tokenSymbol}`);
                    throw new Error(`Could not bridge sufficient funds, amount too low`);
                } else if (remainingNeeded > 0) {
                    console.log(`✅ Remaining amount (${remainingNeeded} ${tokenSymbol}) is within tolerance, considering withdrawal complete`);
                }

                // For ETH: Poll for WETH arrival and automatically unwrap to ETH
                if (tokenSymbol.toLowerCase() === 'eth' && consolidationTxs.length > 0) {
                    const bridgedAmount = requestedAmount - scrollBalance;

                    if (bridgedAmount > 0) {
                        console.log(`🔄 Polling for ${bridgedAmount} WETH arrival on Scroll...`);

                        const scrollChainData = multiChainWalletData['scroll'];
                        if (!scrollChainData?.smartAccount || !scrollChainData?.smartAccountAddress) {
                            throw new Error('Scroll smart account not available for unwrapping');
                        }

                        // Poll for WETH and unwrap when detected
                        const ethSendTx = await this.pollAndUnwrapWETH(
                            bridgedAmount,
                            scrollChainData.smartAccount,
                            scrollChainData.smartAccountAddress,
                            recipientAddress
                        );

                        return {
                            consolidationTxs,
                            withdrawalTx: ethSendTx // Return the final ETH send transaction
                        };
                    }
                }

                // Return the result for non-ETH tokens
                return {
                    consolidationTxs,
                    withdrawalTx: scrollWithdrawalTx || consolidationTxs[consolidationTxs.length - 1]
                };
            }

        } catch (error) {
            console.error(`Error in optimized withdrawal:`, error);
            throw error;
        }
    }

    // Poll for WETH arrival and automatically unwrap to ETH
    private async pollAndUnwrapWETH(
        expectedAmount: number,
        smartAccount: any,
        smartAccountAddress: string,
        recipientAddress: `0x${string}`
    ): Promise<string> {
        const scrollChainConfig = getChainConfig('scroll');
        const wethAddress = scrollChainConfig.tokens.weth;

        if (!wethAddress) {
            throw new Error('WETH not supported on Scroll');
        }

        const publicClient = createPublicClient({
            chain: scrollChainConfig.chain,
            transport: scrollChainConfig.secureTransport
        });

        if (!smartAccountAddress) {
            throw new Error('Smart account address not available');
        }

        console.log(`👀 Polling WETH balance for ${smartAccountAddress}...`);

        // Poll for WETH arrival with timeout
        const maxAttempts = 20; // 5 minutes (60 attempts * 5 seconds)
        const pollInterval = 5000; // 5 seconds

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const wethBalance = await publicClient.readContract({
                    address: wethAddress,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [smartAccountAddress as `0x${string}`],
                }) as bigint;

                const wethBalanceFormatted = parseFloat(formatUnits(wethBalance, 18));

                console.log(`📊 Attempt ${attempt}: WETH balance = ${wethBalanceFormatted}, expected >= ${expectedAmount}`);

                // Check if we have enough WETH (with small tolerance for bridge fees)
                if (wethBalanceFormatted >= expectedAmount * 0.95) { // 5% tolerance
                    console.log(`✅ WETH detected! Unwrapping ${wethBalanceFormatted} WETH to ETH...`);

                    try {
                        // Unwrap all available WETH to ETH
                        const unwrapTx = await this.unwrapWethToEth(
                            'scroll',
                            wethBalanceFormatted.toString(),
                            smartAccount
                        );

                        console.log(`✅ WETH unwrapped: ${unwrapTx}`);

                        // Wait a moment for unwrapping to complete
                        await new Promise(resolve => setTimeout(resolve, 3000));

                        // Send ETH to recipient
                        console.log(`💸 Sending ${wethBalanceFormatted} ETH to recipient...`);

                        try {
                            const ethSendTx = await smartAccount.sendTransaction({
                                to: recipientAddress,
                                value: parseUnits(wethBalanceFormatted.toString(), 18),
                                data: "0x",
                            });

                            console.log(`✅ Native ETH sent to recipient: ${ethSendTx}`);
                            return ethSendTx;

                        } catch (ethSendError: any) {
                            console.error(`❌ Failed to send ETH to recipient:`, ethSendError);

                            // Check if this is a nonce error that can be retried
                            const errorMessage = String(ethSendError).toLowerCase();
                            if (errorMessage.includes('nonce') || errorMessage.includes('aa25')) {
                                console.log(`🔄 Nonce error detected, will retry ETH sending...`);

                                // Wait longer and retry ETH sending
                                await new Promise(resolve => setTimeout(resolve, 5000));

                                try {
                                    const retryEthSendTx = await smartAccount.sendTransaction({
                                        to: recipientAddress,
                                        value: parseUnits(wethBalanceFormatted.toString(), 18),
                                        data: "0x",
                                    });

                                    console.log(`✅ Native ETH sent to recipient (retry): ${retryEthSendTx}`);
                                    return retryEthSendTx;

                                } catch (retryError: any) {
                                    console.error(`❌ ETH send retry also failed:`, retryError);
                                    throw new Error(`ETH unwrapping succeeded but sending failed: ${String(retryError?.message || retryError)}. ETH is now available in your wallet on Scroll.`);
                                }
                            } else {
                                throw new Error(`ETH unwrapping succeeded but sending failed: ${String(ethSendError?.message || ethSendError)}. ETH is now available in your wallet on Scroll.`);
                            }
                        }

                    } catch (unwrapError: any) {
                        console.error(`❌ Failed to unwrap WETH:`, unwrapError);
                        throw new Error(`Failed to unwrap WETH: ${String(unwrapError?.message || unwrapError)}`);
                    }
                }

                // Wait before next attempt
                if (attempt < maxAttempts) {
                    console.log(`⏳ WETH not ready yet, waiting ${pollInterval / 1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

            } catch (error: any) {
                console.error(`Error checking WETH balance (attempt ${attempt}):`, error);

                // If this is a critical error that happened during the WETH processing, 
                // we should break out instead of continuing to poll
                const errorMessage = String(error?.message || error).toLowerCase();
                if (errorMessage.includes('eth unwrapping succeeded')) {
                    // This is a controlled error from our inner try-catch blocks
                    throw error;
                }

                // For other errors (like network issues), continue polling if we have attempts left
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
            }
        }

        throw new Error(`❌ WETH polling timeout: Expected ${expectedAmount} WETH did not arrive on Scroll within 5 minutes. Bridge may be delayed - please check your wallet later or contact support.`);
    }

    // Helper method to execute direct withdrawal (ETH or ERC-20)
    private async executeDirectWithdrawal(
        smartAccount: any,
        tokenSymbol: string,
        amount: string,
        recipientAddress: `0x${string}`
    ): Promise<string> {
        if (tokenSymbol.toLowerCase() === 'eth') {
            // Handle ETH as native token
            const amountInWei = parseUnits(amount, 18); // ETH has 18 decimals

            return await smartAccount.sendTransaction({
                to: recipientAddress,
                value: amountInWei,
                data: "0x",
            });
        } else {
            // Handle ERC-20 tokens (USDC, USDT)
            const scrollChainConfig = getChainConfig('scroll');
            const tokenAddress = scrollChainConfig.tokens[tokenSymbol.toLowerCase() as keyof typeof scrollChainConfig.tokens];

            if (!tokenAddress) {
                throw new Error(`Token ${tokenSymbol} not supported on Scroll`);
            }

            // Get token decimals
            const publicClient = createPublicClient({
                chain: scrollChainConfig.chain,
                transport: scrollChainConfig.secureTransport
            });

            const decimals = await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "decimals",
            });

            const amountInWei = parseUnits(amount, decimals as number);

            return await smartAccount.sendTransaction({
                to: tokenAddress,
                data: encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: "transfer",
                    args: [recipientAddress, amountInWei],
                }),
            });
        }
    }

    // Public method to unwrap WETH to ETH manually
    async unwrapWETH(
        chainKey: SupportedChainKey,
        amount: string,
        multiChainWalletData: MultiChainWalletData
    ): Promise<string> {
        try {
            const chainData = multiChainWalletData[chainKey];
            if (!chainData?.smartAccount) {
                throw new Error(`Smart account not available for ${chainKey}`);
            }

            console.log(`🔄 Unwrapping ${amount} WETH to ETH on ${chainKey}...`);

            const unwrapTx = await this.unwrapWethToEth(
                chainKey,
                amount,
                chainData.smartAccount
            );

            console.log(`✅ Successfully unwrapped ${amount} WETH to ETH: ${unwrapTx}`);
            return unwrapTx;

        } catch (error) {
            console.error(`Error unwrapping WETH:`, error);
            throw error;
        }
    }

    // Get transactions for a wallet address with pagination
    async getTransactions(
        walletAddress: string,
        page: number = 1,
        offset: number = 10
    ): Promise<Transaction[]> {
        try {
            // For proper pagination, we need to fetch more data than just one page
            // since we're combining different sources
            const fetchSize = Math.max(100, offset * 5); // Fetch at least 5 pages worth to ensure proper pagination

            // Fetch vault transactions with larger page size
            const vaultTransactionsPromise = this.getVaultTransactions(walletAddress, 1, fetchSize);

            // Fetch all token transfers (USDC, USDT, ETH) from blockchain explorers
            const allTokenTransfersPromise = this.getAllTokenTransfers(walletAddress, 1, fetchSize);

            // Wait for both promises to resolve
            const [vaultTransactions, allTokenTransfers] = await Promise.all([
                vaultTransactionsPromise,
                allTokenTransfersPromise
            ]);

            // Combine both sets of transactions
            const allTransactions = [...vaultTransactions, ...allTokenTransfers];

            // Sort all transactions by timestamp (newest first)
            allTransactions.sort((a, b) => b.timestamp - a.timestamp);

            // Calculate pagination
            const startIndex = (page - 1) * offset;
            const endIndex = startIndex + offset;

            // Apply pagination to combined results
            const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

            return paginatedTransactions;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }


    // Get vault transactions from server API
    async getVaultTransactions(
        walletAddress: string,
        page: number = 1,
        offset: number = 10,
        getAccessToken?: () => Promise<string>
    ): Promise<Transaction[]> {
        try {
            // Use server API endpoint if access token is available
            let response: Response;
            
            if (getAccessToken) {
                const token = await getAccessToken();
                response = await fetch(
                    `/api/wallets/${walletAddress}/transactions?page_size=${offset}&page_number=${page}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    }
                );
            } else {
                // Fallback to direct backend call for backward compatibility
                response = await fetch(
                    `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/wallets/${walletAddress}/transactions?page_size=${offset}&page_number=${page}`
                );
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.data) {
                // Map the response to our Transaction type
                const mappedTransactions = data.data.map((tx: any) => {
                    // For withdrawals, vault address is fromAddress (withdrawing FROM vault)
                    // For deposits, vault address is toAddress (depositing TO vault)
                    const vaultAddress = tx.transactionType === 'withdraw' ? tx.fromAddress : tx.toAddress;

                    return {
                        id: tx.hash,
                        type: tx.transactionType as TransactionType,
                        date: new Date(tx.timestamp).toISOString(),
                        timestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000),
                        amount: tx.amount,
                        token: 'USDC',
                        status: 'completed', // Assuming all returned transactions are completed
                        hash: tx.hash,
                        smartAccountAddress: tx.fromAddress,
                        vaultId: vaultAddress,
                        vaultName: this.getVaultName(vaultAddress),
                        chainId: 534352, // All vault transactions are on Scroll
                        fromAddress: tx.fromAddress, // Add fromAddress for vault mapping
                    };
                });

                return mappedTransactions;
            }

            return [];
        } catch (error) {
            console.error('Error fetching vault transactions from backend API:', error);
            // Return empty array instead of throwing to ensure EOA transactions can still be displayed
            return [];
        }
    }

    // Get transaction details by hash
    async getTransactionByHash(txHash: string): Promise<Transaction> {
        try {
            // Get current smart account address from wallet API
            const walletSummary = walletAPI.getMultiChainSummary();
            if (!walletSummary?.smartAccountAddress) {
                throw new Error('No smart account address available');
            }

            // Search through multiple pages to find the transaction
            const maxPages = 10; // Search through up to 200 transactions (10 pages * 20)
            const pageSize = 20;

            // First, try to find transaction in combined results
            for (let page = 1; page <= maxPages; page++) {
                const transactions = await this.getTransactions(walletSummary.smartAccountAddress, page, pageSize);

                // Find transaction with matching hash
                const matchingTx = transactions.find(tx => tx.hash === txHash || tx.id === txHash);
                if (matchingTx) {
                    return matchingTx;
                }

                // If we got fewer transactions than pageSize, we've reached the end
                if (transactions.length < pageSize) {
                    break;
                }
            }

            // If transaction wasn't found in the combined results, check specifically in blockchain explorers
            // This is a fallback in case the pagination logic missed it
            try {
                // Check Scroll
                const scrollConfig = getChainConfig('scroll');
                const scrollApiKey = this.SCROLLSCAN_API_KEY;

                const scrollResponse = await fetch(
                    `${this.SCROLLSCAN_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}&apikey=${scrollApiKey}`
                );

                if (scrollResponse.ok) {
                    const scrollData = await scrollResponse.json();
                    if (scrollData.status === '1' && scrollData.result) {
                        // Check if this is a USDC token transfer
                        if (scrollData.result.input.startsWith('0xa9059cbb')) { // ERC20 transfer method
                            // Get token transfers for this transaction
                            const tokenResponse = await fetch(
                                `${this.SCROLLSCAN_API_URL}?module=account&action=tokentx&txhash=${txHash}&apikey=${scrollApiKey}`
                            );

                            if (tokenResponse.ok) {
                                const tokenData = await tokenResponse.json();
                                if (tokenData.status === '1' && tokenData.result && tokenData.result.length > 0) {
                                    // Check if this is a USDC transfer
                                    const tokenTransfer = tokenData.result[0];
                                    if (tokenTransfer.contractAddress.toLowerCase() === scrollConfig.tokens.usdc.toLowerCase()) {
                                        // It's a USDC transfer, process it
                                        const isReceived = tokenTransfer.to.toLowerCase() === walletSummary.smartAccountAddress.toLowerCase();
                                        return {
                                            id: txHash,
                                            type: isReceived ? 'transfer-in' : 'transfer-out',
                                            date: new Date(parseInt(tokenTransfer.timeStamp) * 1000).toISOString(),
                                            timestamp: parseInt(tokenTransfer.timeStamp),
                                            amount: parseFloat(formatUnits(BigInt(tokenTransfer.value), 6)),
                                            token: 'USDC',
                                            status: 'completed',
                                            hash: txHash,
                                            smartAccountAddress: walletSummary.smartAccountAddress,
                                            vaultId: isReceived ? tokenTransfer.from : tokenTransfer.to,
                                            vaultName: isReceived ? `From: ${this.formatAddress(tokenTransfer.from)}` : `To: ${this.formatAddress(tokenTransfer.to)}`,
                                            chainId: 534352 // Scroll chain ID
                                        };
                                    }
                                }
                            }
                        }
                    }
                }

                // Check Base
                const baseConfig = getChainConfig('base');
                const baseApiKey = this.BASESCAN_API_KEY;

                if (baseApiKey) {
                    const baseResponse = await fetch(
                        `${this.BASESCAN_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}&apikey=${baseApiKey}`
                    );

                    if (baseResponse.ok) {
                        const baseData = await baseResponse.json();
                        if (baseData.status === '1' && baseData.result) {
                            // Check if this is a USDC token transfer
                            if (baseData.result.input.startsWith('0xa9059cbb')) { // ERC20 transfer method
                                // Get token transfers for this transaction
                                const tokenResponse = await fetch(
                                    `${this.BASESCAN_API_URL}?module=account&action=tokentx&txhash=${txHash}&apikey=${baseApiKey}`
                                );

                                if (tokenResponse.ok) {
                                    const tokenData = await tokenResponse.json();
                                    if (tokenData.status === '1' && tokenData.result && tokenData.result.length > 0) {
                                        // Check if this is a USDC transfer
                                        const tokenTransfer = tokenData.result[0];
                                        if (tokenTransfer.contractAddress.toLowerCase() === baseConfig.tokens.usdc.toLowerCase()) {
                                            // It's a USDC transfer, process it
                                            const isReceived = tokenTransfer.to.toLowerCase() === walletSummary.smartAccountAddress.toLowerCase();
                                            return {
                                                id: txHash,
                                                type: isReceived ? 'transfer-in' : 'transfer-out',
                                                date: new Date(parseInt(tokenTransfer.timeStamp) * 1000).toISOString(),
                                                timestamp: parseInt(tokenTransfer.timeStamp),
                                                amount: parseFloat(formatUnits(BigInt(tokenTransfer.value), 6)),
                                                token: 'USDC',
                                                status: 'completed',
                                                hash: txHash,
                                                smartAccountAddress: walletSummary.smartAccountAddress,
                                                vaultId: isReceived ? tokenTransfer.from : tokenTransfer.to,
                                                vaultName: isReceived ? `From: ${this.formatAddress(tokenTransfer.from)}` : `To: ${this.formatAddress(tokenTransfer.to)}`,
                                                chainId: 8453 // Base chain ID
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (exploreError) {
                console.error('Error checking blockchain explorers:', exploreError);
            }

            throw new Error('Transaction not found');
        } catch (error) {
            console.error('Error fetching transaction by hash:', error);
            throw error;
        }
    }

    // Helper method to get vault name based on address
    private getVaultName(address: string): string {
        if (address.toLowerCase() === this.CRON_ADDRESS.toLowerCase()) {
            return 'Cron Job';
        }

        // Check vault addresses with case-insensitive lookup
        const vaultName = Object.entries(this.VAULT_ADDRESSES)
            .find(([vaultAddress]) => vaultAddress.toLowerCase() === address.toLowerCase())?.[1];

        return vaultName || 'Vault';
    }

    // Format transaction data for display
    formatTransaction(tx: Transaction) {
        return {
            ...tx,
            amount: tx.amount.toFixed(2), // Format USDC amount to 2 decimal places
            date: new Date(tx.timestamp * 1000).toLocaleDateString(),
            // Format addresses for display
            from: tx.type === 'transfer-in'
                ? this.formatAddress(tx.vaultId || '')
                : this.formatAddress(tx.smartAccountAddress || ''),
            target: tx.type === 'transfer-out'
                ? this.formatAddress(tx.vaultId || '')
                : this.getVaultName(tx.vaultId || ''),
            // Include method name for better readability
            method: this.getMethodName(tx.type),
        };
    }

    // Helper method to get method name
    private getMethodName(type: TransactionType): string {
        switch (type) {
            case 'deposit':
                return 'Deposit';
            case 'withdraw':
                return 'Withdraw';
            case 'accrue':
                return 'Accrue & Flush';
            case 'transfer-in':
                return 'Received';
            case 'transfer-out':
                return 'Sent';
            case 'swap':
                return 'Swap';
            case 'other':
                return 'Other';
            default:
                return 'Unknown';
        }
    }

    // Shared helper to get addresses to exclude from external transactions
    private getInternalAddresses(): {
        vaultAddresses: string[];
        acrossProtocolAddresses: string[];
        internalProtocolAddresses: string[];
        odosRouterAddresses: string[];
    } {
        // Get all active vaults to identify vault transactions
        const vaultAddresses = Object.values(this.VAULT_ADDRESSES).map(name =>
            Object.entries(this.VAULT_ADDRESSES).find(([addr, n]) => n === name)?.[0]
        ).filter(Boolean) as string[];

        // Add virtual vault and combined vault addresses from vault configs
        const allVaults = getActiveVaults();
        allVaults.forEach(vault => {
            if (vault.virtualVaultAddress) vaultAddresses.push(vault.virtualVaultAddress);
            if (vault.combinedVaultAddress) vaultAddresses.push(vault.combinedVaultAddress);
        });

        // Across Protocol addresses - ANY transfer from these should be ignored
        const acrossProtocolAddresses = [
            this.ACROSS_SPOKE_POOL_ADDRESSES.base,
            this.ACROSS_SPOKE_POOL_ADDRESSES.scroll,
            this.ACROSS_SPOKE_POOL_ADDRESSES.optimism,
            this.ACROSS_SPOKE_POOL_ADDRESSES.arbitrum,
            this.ACROSS_SPOKE_POOL_ADDRESSES.polygon,
            this.ACROSS_MULTICALL_HANDLER_ADDRESSES.scroll,
            '0x41ee28ee05341e7fdddc8d433ba66054cd302ca1', // Relayer 1
            '0x4fd8608ea002829d0478696f5b3330cf43761ea1', // Relayer 2
        ].filter(Boolean);

        const odosRouterAddresses = [
            '0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1', // Scroll
            '0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf', // Polygon
            '0x19cEeAd7105607Cd444F5ad10dd51356436095a1', // Base
            '0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680', // Optimism
            '0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13', // Arbitrum
        ].filter(Boolean);

        // Other protocol addresses to exclude as internal (including WETH addresses)
        const internalProtocolAddresses = [
            '0x1d738a3436a8c49ceffbab7fbf04b660fb528cbd', // Aave
            '0xb2f97c1bd3bf02f5e74d13f02e3e26f93d77ce44', // Compound
            '0x0000000000000000000000000000000000000000', // Zero address
        ];

        // Add WETH addresses from all supported chains (since WETH wrapping/unwrapping is internal)
        const chainConfigs = ['scroll', 'base', 'optimism', 'arbitrum', 'polygon'];
        chainConfigs.forEach(chainName => {
            try {
                const chainConfig = getChainConfig(chainName as SupportedChainKey);
                if (chainConfig.tokens.weth) {
                    internalProtocolAddresses.push(chainConfig.tokens.weth);
                }
            } catch (error) {
                // Chain not supported, continue
            }
        });

        return { vaultAddresses, acrossProtocolAddresses, internalProtocolAddresses, odosRouterAddresses };
    }

    // Shared helper to categorize and process transfers
    private processTransfers(
        allTransfers: any[],
        walletAddress: string,
        tokenSymbol: string,
        tokenDecimals: number
    ): Transaction[] {
        const { vaultAddresses, acrossProtocolAddresses, internalProtocolAddresses, odosRouterAddresses } = this.getInternalAddresses();

        // Convert to lowercase for comparison
        const vaultAddressesLower = vaultAddresses.map(addr => addr.toLowerCase());
        const acrossAddressesLower = acrossProtocolAddresses.map(addr => addr.toLowerCase());
        const internalAddressesLower = internalProtocolAddresses.map(addr => addr.toLowerCase());
        const odosAddressesLower = odosRouterAddresses.map(addr => addr.toLowerCase());

        const walletAddressLower = walletAddress.toLowerCase();
        const processedTransactions: Transaction[] = [];
        const processedHashes = new Set<string>(); // To avoid duplicates

        for (const transfer of allTransfers) {
            // Skip if already processed
            if (processedHashes.has(transfer.hash)) continue;

            const fromAddress = transfer.from.toLowerCase();
            const toAddress = transfer.to.toLowerCase();
            const isReceived = toAddress === walletAddressLower;
            const isSent = fromAddress === walletAddressLower;

            // Skip if not involving the wallet
            if (!isReceived && !isSent) continue;

            let transactionType: TransactionType | null = null;
            let vaultId: string | undefined;
            let vaultName: string | undefined;

            // Categorize the transaction
            if (isReceived) {
                // Receiving funds
                if (vaultAddressesLower.includes(fromAddress)) {
                    // Vault withdrawal - handled by vault transactions API
                    continue;
                } else if (acrossAddressesLower.includes(fromAddress)) {
                    // Incoming bridge transfer (FROM Across) - skip as internal
                    continue;
                } else if (internalAddressesLower.includes(fromAddress)) {
                    // Other internal protocol transfers - skip
                    continue;
                } else if (odosAddressesLower.includes(fromAddress)) {
                    continue; // Odos router transaction - will be handled by swap detection
                } else {
                    // External transfer in (from EOA or external source)
                    transactionType = 'transfer-in';
                    vaultId = fromAddress;
                    vaultName = `From: ${this.formatAddress(transfer.from)}`;
                }
            } else if (isSent) {
                // Sending funds
                if (vaultAddressesLower.includes(toAddress)) {
                    // Vault deposit - handled by vault transactions API
                    continue;
                } else if (acrossAddressesLower.includes(toAddress)) {
                    // Outgoing bridge transfer (TO Across) - show as transfer-out
                    transactionType = 'transfer-out';
                    vaultId = toAddress;
                    vaultName = `Bridge: ${this.formatAddress(transfer.to)}`;
                } else if (odosAddressesLower.includes(toAddress)) {
                    continue; // Odos router transaction - will be handled by swap detection
                } else if (internalAddressesLower.includes(toAddress)) {
                    // Other internal protocol transfers - skip
                    continue;
                } else {
                    // External transfer out (to EOA or external destination)
                    transactionType = 'transfer-out';
                    vaultId = toAddress;
                    vaultName = `To: ${this.formatAddress(transfer.to)}`;
                }
            }

            // Only add valid external transactions
            if (transactionType) {
                const amount = parseFloat(formatUnits(BigInt(transfer.value), tokenDecimals));

                // Skip zero amount transfers
                if (amount === 0) continue;

                processedTransactions.push({
                    id: transfer.hash,
                    type: transactionType,
                    date: new Date(parseInt(transfer.timeStamp) * 1000).toISOString(),
                    timestamp: parseInt(transfer.timeStamp),
                    amount: amount,
                    token: tokenSymbol,
                    status: 'completed',
                    hash: transfer.hash,
                    smartAccountAddress: walletAddress,
                    vaultId: vaultId,
                    vaultName: vaultName,
                    chainId: transfer.chainId
                });

                processedHashes.add(transfer.hash);
            }
        }

        // Sort by timestamp (newest first)
        processedTransactions.sort((a, b) => b.timestamp - a.timestamp);

        return processedTransactions;
    }

    // Fetch USDC token transfers from blockchain explorers
    async getUsdcTransfers(walletAddress: string): Promise<Transaction[]> {
        try {
            return await this.getTokenTransfers(walletAddress, 'USDC');
        } catch (error) {
            console.error('Error fetching USDC transfers:', error);
            throw error;
        }
    }

    // Fetch USDT token transfers from blockchain explorers
    async getUsdtTransfers(walletAddress: string): Promise<Transaction[]> {
        try {
            return await this.getTokenTransfers(walletAddress, 'USDT');
        } catch (error) {
            console.error('Error fetching USDT transfers:', error);
            throw error;
        }
    }

    // Fetch ETH transfers from blockchain explorers
    async getEthTransfers(walletAddress: string): Promise<Transaction[]> {
        try {
            // Fetch ETH transfers from all chains
            const allTransfers: any[] = [];

            // Helper function to fetch ETH transfers for a chain
            const fetchChainEthTransfers = async (chainName: string) => {
                try {

                    // Fetch both regular transactions AND internal transactions
                    const [regularTxs, internalTxs] = await Promise.all([
                        // Regular transactions
                        fetch(`/api/transactions/scan?${new URLSearchParams({
                            chain: chainName,
                            address: walletAddress,
                            action: 'txlist'
                        }).toString()}`).then(res => res.json()),

                        // Internal transactions (for smart account ETH transfers)
                        fetch(`/api/transactions/scan?${new URLSearchParams({
                            chain: chainName,
                            address: walletAddress,
                            action: 'txlistinternal'
                        }).toString()}`).then(res => res.json())
                    ]);

                    const allEthTxs = [];

                    // Process regular transactions
                    if (regularTxs.status === '1' && Array.isArray(regularTxs.result)) {
                        const ethTransfers = regularTxs.result.filter((tx: any) => {
                            const hasValue = tx.value && tx.value !== '0';
                            const isSimpleTransfer = !tx.input || tx.input === '0x' || tx.input === '0x0';

                            // Debug specific transactions
                            if (hasValue) {
                                const isReceived = tx.to.toLowerCase() === walletAddress.toLowerCase();
                                const isSent = tx.from.toLowerCase() === walletAddress.toLowerCase();
                            }

                            return hasValue && isSimpleTransfer;
                        });
                        allEthTxs.push(...ethTransfers);
                    }

                    // Process internal transactions (where smart account ETH transfers happen)
                    if (internalTxs.status === '1' && Array.isArray(internalTxs.result)) {
                        const internalEthTransfers = internalTxs.result.filter((tx: any) => {
                            const hasValue = tx.value && tx.value !== '0';

                            // Debug internal transactions
                            if (hasValue) {
                                const isReceived = tx.to.toLowerCase() === walletAddress.toLowerCase();
                                const isSent = tx.from.toLowerCase() === walletAddress.toLowerCase();
                            }

                            return hasValue;
                        });
                        allEthTxs.push(...internalEthTransfers);
                    }

                    const chainConfig = getChainConfig(chainName as SupportedChainKey);
                    allTransfers.push(...allEthTxs.map((tx: any) => ({
                        ...tx,
                        chain: chainName,
                        chainId: chainConfig.chain.id
                    })));
                } catch (error) {
                    console.error(`Error fetching ${chainName} ETH transfers:`, error);
                }
            };

            // Fetch from all chains
            await Promise.all([
                fetchChainEthTransfers('scroll'),
                fetchChainEthTransfers('base'),
                fetchChainEthTransfers('optimism'),
                fetchChainEthTransfers('arbitrum'),
                fetchChainEthTransfers('polygon')
            ]);

            // Process using shared helper with ETH decimals (18)
            const processedTransfers = this.processTransfers(allTransfers, walletAddress, 'ETH', 18);

            return processedTransfers;
        } catch (error) {
            console.error('Error fetching ETH transfers:', error);
            throw error;
        }
    }

    // Generic method to fetch token transfers (USDC, USDT)
    private async getTokenTransfers(
        walletAddress: string,
        tokenSymbol: string
    ): Promise<Transaction[]> {
        try {

            // Fetch transfers from all chains
            const allTransfers: any[] = [];

            // Helper function to fetch transfers for a chain
            const fetchChainTransfers = async (chainName: string) => {
                try {
                    const params = new URLSearchParams({
                        chain: chainName,
                        address: walletAddress,
                        action: 'tokentx',
                        token: tokenSymbol.toLowerCase() // Pass the token parameter
                    });

                    const response = await fetch(`/api/transactions/scan?${params.toString()}`);
                    const data = await response.json();

                    if (data.status === '1' && Array.isArray(data.result)) {
                        // No need for client-side filtering since API now filters by contract address
                        const tokenTransfers = data.result;

                        allTransfers.push(...tokenTransfers.map((tx: any) => ({
                            ...tx,
                            chain: chainName,
                            chainId: getChainConfig(chainName as SupportedChainKey).chain.id
                        })));
                        console.log(`✅ Found ${tokenTransfers.length} ${chainName} ${tokenSymbol} transfers`);
                    } else {
                        console.log(`❌ No ${tokenSymbol} transfers found for ${chainName} or API error:`, data);
                    }
                } catch (error) {
                    console.error(`❌ Error fetching ${chainName} ${tokenSymbol} transfers:`, error);
                }
            };

            // Fetch from all chains
            await Promise.all([
                fetchChainTransfers('scroll'),
                fetchChainTransfers('base'),
                fetchChainTransfers('optimism'),
                fetchChainTransfers('arbitrum'),
                fetchChainTransfers('polygon')
            ]);

            console.log(`📈 Total ${tokenSymbol} transfers found: ${allTransfers.length}`);

            // Process using shared helper with token decimals (6 for USDC/USDT)
            const tokenDecimals = (tokenSymbol.toLowerCase() === 'usdc' || tokenSymbol.toLowerCase() === 'usdt') ? 6 : 18;
            return this.processTransfers(allTransfers, walletAddress, tokenSymbol, tokenDecimals);
        } catch (error) {
            console.error(`❌ Error fetching ${tokenSymbol} transfers:`, error);
            throw error;
        }
    }

    // Enhanced pattern detection that looks for swap-like behavior
    private async detectSwapsByBehaviorPattern(walletAddress: string): Promise<Transaction[]> {
        console.log(`🔍 Detecting swaps by analyzing behavior patterns...`);

        const swapTransactions: Transaction[] = [];

        // Strategy: Collect all transfers and analyze transaction hashes for complete swap patterns

        for (const chainName of ['scroll', 'base', 'optimism', 'arbitrum', 'polygon']) {
            try {
                // Get ALL transfers for this chain (USDC, USDT, and ETH)
                const [usdcTransfers, usdtTransfers, ethTransfers] = await Promise.all([
                    fetch(`/api/transactions/scan?${new URLSearchParams({
                        chain: chainName,
                        address: walletAddress,
                        action: 'tokentx',
                        token: 'usdc'
                    }).toString()}`).then(res => res.json()),

                    fetch(`/api/transactions/scan?${new URLSearchParams({
                        chain: chainName,
                        address: walletAddress,
                        action: 'tokentx',
                        token: 'usdt'
                    }).toString()}`).then(res => res.json()),

                    // Fetch ETH internal transactions for swap detection
                    fetch(`/api/transactions/scan?${new URLSearchParams({
                        chain: chainName,
                        address: walletAddress,
                        action: 'txlistinternal'
                    }).toString()}`).then(res => res.json())
                ]);

                // Combine all transfers
                const allTransfers: any[] = [];
                
                if (usdcTransfers.status === '1' && usdcTransfers.result) {
                    allTransfers.push(...usdcTransfers.result.map((tx: any) => ({ ...tx, tokenSymbol: 'USDC' })));
                }
                
                if (usdtTransfers.status === '1' && usdtTransfers.result) {
                    allTransfers.push(...usdtTransfers.result.map((tx: any) => ({ ...tx, tokenSymbol: 'USDT' })));
                }

                // Add ETH internal transfers (filter for value transfers only)
                if (ethTransfers.status === '1' && ethTransfers.result) {
                    const ethValueTransfers = ethTransfers.result.filter((tx: any) => 
                        tx.value && tx.value !== '0'
                    );
                    allTransfers.push(...ethValueTransfers.map((tx: any) => ({ ...tx, tokenSymbol: 'ETH' })));
                }

                // Group transfers by transaction hash
                const transfersByHash = new Map<string, any[]>();
                allTransfers.forEach(transfer => {
                    if (!transfersByHash.has(transfer.hash)) {
                        transfersByHash.set(transfer.hash, []);
                    }
                    transfersByHash.get(transfer.hash)!.push(transfer);
                });

                const odosRouterAddresses = [
                    '0xbfe03c9e20a9fc0b37de01a172f207004935e0b1', // Scroll
                    '0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf', // Polygon
                    '0x19cEeAd7105607Cd444F5ad10dd51356436095a1', // Base
                    '0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680', // Optimism
                    '0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13', // Arbitrum
                ].map(addr => addr.toLowerCase());

                // Analyze each transaction hash for swap patterns
                transfersByHash.forEach((transfers, hash) => {
                    // Look for swaps: user sends token A, receives token B from Odos router
                    const outgoing = transfers.find(tx => 
                        tx.from?.toLowerCase() === walletAddress.toLowerCase()
                    );
                    
                    const incoming = transfers.find(tx => 
                        tx.to?.toLowerCase() === walletAddress.toLowerCase() &&
                        odosRouterAddresses.includes(tx.from?.toLowerCase() || '')
                    );

                    if (outgoing && incoming && outgoing.hash === incoming.hash) {
                        // This is a complete swap!
                        const inputToken = outgoing.tokenSymbol;
                        const outputToken = incoming.tokenSymbol;
                        
                        // Get correct decimals for each token
                        const getTokenDecimals = (token: string) => {
                            if (token === 'ETH') return 18;
                            if (token === 'USDC' || token === 'USDT') return 6;
                            return 18; // Default fallback
                        };
                        
                        const inputAmount = parseFloat(formatUnits(BigInt(outgoing.value), getTokenDecimals(inputToken)));
                        const outputAmount = parseFloat(formatUnits(BigInt(incoming.value), getTokenDecimals(outputToken)));

                        swapTransactions.push({
                            id: hash,
                            type: 'swap',
                            date: new Date(parseInt(incoming.timeStamp) * 1000).toISOString(),
                            timestamp: parseInt(incoming.timeStamp),
                            amount: outputAmount,
                            token: outputToken,
                            status: 'completed',
                            hash: hash,
                            smartAccountAddress: walletAddress,
                            vaultId: `swap_${inputToken}_${outputToken}`,
                            vaultName: `Swap ${inputToken} → ${outputToken}`,
                            chainId: getChainConfig(chainName as SupportedChainKey).chain.id,
                            fromAddress: incoming.from,
                            swapDetails: {
                                inputToken: inputToken,
                                outputToken: outputToken,
                                inputAmount: inputAmount,
                                outputAmount: outputAmount,
                            }
                        });
                    }
                });

            } catch (error) {
                console.error(`Error checking ${chainName} for behavior patterns:`, error);
            }
        }

        return swapTransactions;
    }

    // OPTIMIZED: Super-parallel token transfer fetching - fetch ALL tokens from ALL chains simultaneously
    async getAllTokenTransfersOptimized(
        walletAddress: string,
        page: number = 1,
        offset: number = 100
    ): Promise<Transaction[]> {
        try {
            console.log(`🚀 Starting super-parallel transaction fetch for all tokens...`);

            // Create all fetch promises upfront - 15 parallel requests (3 tokens × 5 chains)
            const allFetchPromises: Promise<any>[] = [];

            // Define chains and tokens
            const chains = ['scroll', 'base', 'optimism', 'arbitrum', 'polygon'];
            const tokens = ['usdc', 'usdt'];

            // Add token transfer promises (10 parallel requests: 2 tokens × 5 chains)
            for (const chainName of chains) {
                for (const tokenSymbol of tokens) {
                    const promise = fetch(`/api/transactions/scan?${new URLSearchParams({
                        chain: chainName,
                        address: walletAddress,
                        action: 'tokentx',
                        token: tokenSymbol
                    }).toString()}`)
                        .then(res => res.json())
                        .then(data => ({ 
                            type: `${tokenSymbol.toUpperCase()}_${chainName.toUpperCase()}`, 
                            chain: chainName, 
                            data, 
                            decimals: 6,
                            tokenSymbol: tokenSymbol.toUpperCase()
                        }))
                        .catch(error => {
                            console.error(`❌ Error fetching ${chainName} ${tokenSymbol}:`, error);
                            return { type: `${tokenSymbol.toUpperCase()}_${chainName.toUpperCase()}`, chain: chainName, data: { status: '0', result: [] }, decimals: 6, tokenSymbol: tokenSymbol.toUpperCase() };
                        });
                    
                    allFetchPromises.push(promise);
                }
            }

            // Add ETH transfer promises (5 parallel requests: ETH × 5 chains)
            for (const chainName of chains) {
                // Regular ETH transactions
                const regularEthPromise = fetch(`/api/transactions/scan?${new URLSearchParams({
                    chain: chainName,
                    address: walletAddress,
                    action: 'txlist'
                }).toString()}`)
                    .then(res => res.json())
                    .then(data => ({ 
                        type: `ETH_REGULAR_${chainName.toUpperCase()}`, 
                        chain: chainName, 
                        data, 
                        decimals: 18,
                        tokenSymbol: 'ETH'
                    }))
                    .catch(error => {
                        console.error(`❌ Error fetching ${chainName} ETH regular:`, error);
                        return { type: `ETH_REGULAR_${chainName.toUpperCase()}`, chain: chainName, data: { status: '0', result: [] }, decimals: 18, tokenSymbol: 'ETH' };
                    });

                // Internal ETH transactions
                const internalEthPromise = fetch(`/api/transactions/scan?${new URLSearchParams({
                    chain: chainName,
                    address: walletAddress,
                    action: 'txlistinternal'
                }).toString()}`)
                    .then(res => res.json())
                    .then(data => ({ 
                        type: `ETH_INTERNAL_${chainName.toUpperCase()}`, 
                        chain: chainName, 
                        data, 
                        decimals: 18,
                        tokenSymbol: 'ETH'
                    }))
                    .catch(error => {
                        console.error(`❌ Error fetching ${chainName} ETH internal:`, error);
                        return { type: `ETH_INTERNAL_${chainName.toUpperCase()}`, chain: chainName, data: { status: '0', result: [] }, decimals: 18, tokenSymbol: 'ETH' };
                    });

                allFetchPromises.push(regularEthPromise, internalEthPromise);
            }

            console.log(`⚡ Executing ${allFetchPromises.length} parallel blockchain API calls...`);
            
            // Execute ALL requests in parallel
            const startTime = Date.now();
            const allResults = await Promise.all(allFetchPromises);
            const fetchTime = Date.now() - startTime;
            
            console.log(`✅ All blockchain API calls completed in ${fetchTime}ms`);

            // Process results by grouping and filtering
            const allTransfers: any[] = [];
            const resultStats = { USDC: 0, USDT: 0, ETH: 0 };

            for (const result of allResults) {
                const { type, chain, data, decimals, tokenSymbol } = result;
                
                if (data.status === '1' && Array.isArray(data.result)) {
                    let filteredTransfers = data.result;

                    // Filter ETH transfers
                    if (type.startsWith('ETH')) {
                        filteredTransfers = data.result.filter((tx: any) => {
                            const hasValue = tx.value && tx.value !== '0';
                            if (type.includes('REGULAR')) {
                                const isSimpleTransfer = !tx.input || tx.input === '0x' || tx.input === '0x0';
                                return hasValue && isSimpleTransfer;
                            } else {
                                // Internal transactions - just check for value
                                return hasValue;
                            }
                        });
                    }

                    // Add chain info to each transfer
                    const chainConfig = getChainConfig(chain as SupportedChainKey);
                    const transfersWithChain = filteredTransfers.map((tx: any) => ({
                        ...tx,
                        chain,
                        chainId: chainConfig.chain.id,
                        tokenSymbol
                    }));

                    allTransfers.push(...transfersWithChain);
                    resultStats[tokenSymbol as keyof typeof resultStats] += transfersWithChain.length;
                }
            }

            console.log(`📊 Total transfers found: USDC: ${resultStats.USDC}, USDT: ${resultStats.USDT}, ETH: ${resultStats.ETH}`);

            // Process all transfers using the shared helper
            const processedTransactions: Transaction[] = [];
            
            // Group transfers by token type for processing
            const usdcTransfers = allTransfers.filter(tx => tx.tokenSymbol === 'USDC');
            const usdtTransfers = allTransfers.filter(tx => tx.tokenSymbol === 'USDT');
            const ethTransfers = allTransfers.filter(tx => tx.tokenSymbol === 'ETH');

            // Process each token type
            processedTransactions.push(...this.processTransfers(usdcTransfers, walletAddress, 'USDC', 6));
            processedTransactions.push(...this.processTransfers(usdtTransfers, walletAddress, 'USDT', 6));
            processedTransactions.push(...this.processTransfers(ethTransfers, walletAddress, 'ETH', 18));

            // Detect swaps
            const processedSwaps = await this.detectSwapsByBehaviorPattern(walletAddress)

            // Combine and deduplicate swaps
            const allSwaps = [...processedSwaps];
            const uniqueSwaps = allSwaps.filter((swap, index, arr) =>
                arr.findIndex(s => s.hash === swap.hash) === index
            );
            
            // Remove duplicates (if a swap was also detected as a regular transfer)
            const swapHashes = new Set(uniqueSwaps.map(swap => swap.hash));
            const filteredRegularTransactions = processedTransactions.filter(tx => !swapHashes.has(tx.hash));

            // Combine and sort all transactions
            const allTransactions = [...filteredRegularTransactions, ...uniqueSwaps];
            allTransactions.sort((a, b) => b.timestamp - a.timestamp);

            const totalTime = Date.now() - startTime;
            console.log(`🎉 Super-parallel fetch completed in ${totalTime}ms, found ${uniqueSwaps.length} swaps, returning ${Math.min(allTransactions.length, offset)} transactions`);

            // Apply pagination
            return allTransactions.slice(0, offset);

        } catch (error) {
            console.error('Error in optimized token transfer fetch:', error);
            throw error;
        }
    }

    // Updated getAllTokenTransfers with simplified swap detection
    async getAllTokenTransfers(
        walletAddress: string,
        page: number = 1,
        offset: number = 100
    ): Promise<Transaction[]> {
        try {
            // Fetch regular transfers
            const [usdcTransfers, usdtTransfers, ethTransfers] = await Promise.all([
                this.getUsdcTransfers(walletAddress),
                this.getUsdtTransfers(walletAddress),
                this.getEthTransfers(walletAddress)
            ]);

            // Try multiple swap detection methods
            const [knownPatternSwaps] = await Promise.all([
                // this.detectSwapsFromKnownPatterns(walletAddress),
                this.detectSwapsByBehaviorPattern(walletAddress)
            ]);

            // Combine and deduplicate swaps
            const allSwaps = [...knownPatternSwaps];
            const uniqueSwaps = allSwaps.filter((swap, index, arr) =>
                arr.findIndex(s => s.hash === swap.hash) === index
            );

            // Combine all transfers
            const regularTransfers = [...usdcTransfers, ...usdtTransfers, ...ethTransfers];

            // Remove duplicates (if a swap was also detected as a regular transfer)
            const swapHashes = new Set(uniqueSwaps.map(swap => swap.hash));
            const filteredRegularTransfers = regularTransfers.filter(tx => !swapHashes.has(tx.hash));

            // Combine and sort
            const allTransfers = [...filteredRegularTransfers, ...uniqueSwaps];
            allTransfers.sort((a, b) => b.timestamp - a.timestamp);

            const limitedTransfers = allTransfers.slice(0, offset);

            return limitedTransfers;
        } catch (error) {
            console.error('Error fetching all token transfers:', error);
            throw error;
        }
    }

    // Helper method to format addresses
    private formatAddress(address: string): string {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Get transaction status
    async getTransactionStatus(txHash: string): Promise<string> {
        try {
            const tx = await this.getTransactionByHash(txHash);
            return tx?.status || 'unknown';
        } catch (error) {
            console.error('Error getting transaction status:', error);
            return 'unknown';
        }
    }

    // Get transaction receipt
    async getTransactionReceipt(txHash: string) {
        try {
            return await this.publicClient.getTransactionReceipt({
                hash: txHash as `0x${string}`
            });
        } catch (error) {
            console.error('Error getting transaction receipt:', error);
            throw error;
        }
    }

    // New method to deposit to vault with scalable vault ID support
    async depositToVault(
        vaultId: string,
        amount: string,
        multiChainWalletData: MultiChainWalletData
    ): Promise<{
        success: boolean;
        transactionHash?: string;
        crossChain?: boolean;
        consolidationTxs?: string[];
    }> {
        try {
            console.log(`Starting deposit: ${amount} USDC to vault ${vaultId}`);

            // 1. Validate vault ID and get vault configuration
            const vaultConfig = getVaultConfig(vaultId);
            if (!vaultConfig) {
                throw new Error(`Unknown vault ID: ${vaultId}`);
            }

            if (!vaultConfig.isActive) {
                throw new Error(`Vault ${vaultConfig.name} is not yet active`);
            }

            const requestedAmount = parseFloat(amount);

            // 2. Check Scroll balance first
            const scrollBalance = await walletAPI.getTokenBalance('scroll', 'USDC');
            const scrollBalanceNum = parseFloat(scrollBalance);

            console.log(`Scroll balance: ${scrollBalance} USDC`);
            console.log(`Requested amount: ${amount} USDC for vault: ${vaultConfig.name}`);

            // 3. If Scroll has enough balance, proceed with direct deposit
            if (scrollBalanceNum >= requestedAmount) {
                console.log(`✅ Scroll has sufficient balance, proceeding with direct vault deposit`);
                return await this.directDepositToVault(vaultConfig, amount, multiChainWalletData);
            }

            // 4. Cross-chain deposit with bridging from other chains
            else {
                console.log(`🌉 Using cross-chain bridge for vault deposit`);
                return await this.crossChainDepositToVault(vaultConfig, amount, multiChainWalletData);
            }

        } catch (error) {
            console.error(`Error depositing to vault ${vaultId}:`, error);
            throw error;
        }
    }

    // Helper method for direct deposit to vault on Scroll
    private async directDepositToVault(
        vaultConfig: VaultConfig,
        amount: string,
        multiChainWalletData: MultiChainWalletData
    ): Promise<{ success: boolean; transactionHash: string; crossChain: false }> {
        try {
            const scrollChainData = multiChainWalletData['scroll'];
            if (!scrollChainData?.smartAccount) {
                throw new Error('Scroll smart account not available');
            }

            const scrollChainConfig = getChainConfig('scroll');
            const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals

            // Create USDC contract instance for checking allowance
            const publicClient = createPublicClient({
                chain: scrollChainConfig.chain,
                transport: scrollChainConfig.secureTransport
            });

            // Check current allowance for the virtual vault
            const currentAllowance = await publicClient.readContract({
                address: scrollChainConfig.tokens.usdc,
                abi: ERC20_ABI,
                functionName: "allowance",
                args: [scrollChainData.smartAccountAddress as `0x${string}`, vaultConfig.virtualVaultAddress],
            }) as bigint;

            console.log(`Current allowance for ${vaultConfig.name}: ${formatUnits(currentAllowance, 6)} USDC`);

            const calls = [];

            // Add approval if needed
            if (currentAllowance < amountInWei) {
                console.log("Adding approval transaction to batch...");

                const approveCalldata = encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [vaultConfig.virtualVaultAddress, parseUnits("1000000", 6)], // Approve large amount
                });

                calls.push({
                    to: scrollChainConfig.tokens.usdc,
                    data: approveCalldata,
                });
            }

            // Add vault deposit transaction
            const depositCalldata = encodeFunctionData({
                abi: vaultConfig.virtualVaultAbi,
                functionName: vaultConfig.depositMethod,
                args: [amountInWei, scrollChainData.smartAccountAddress],
            });

            calls.push({
                to: vaultConfig.virtualVaultAddress,
                data: depositCalldata,
            });

            console.log(`Executing ${calls.length} transaction(s) for direct vault deposit...`);

            // Execute transactions
            let transactionHash: string;
            if (calls.length === 1) {
                transactionHash = await scrollChainData.smartAccount.sendTransaction(calls[0]);
            } else {
                console.log("1️⃣ Sending approval transaction...");
                await scrollChainData.smartAccount.sendTransaction(calls[0]);

                console.log("2️⃣ Sending vault deposit transaction...");
                transactionHash = await scrollChainData.smartAccount.sendTransaction(calls[1]);
            }

            console.log(`✅ Direct vault deposit completed: ${transactionHash}`);

            return {
                success: true,
                transactionHash,
                crossChain: false,
            };

        } catch (error) {
            console.error("Error in direct vault deposit:", error);
            throw error;
        }
    }

    // Helper method for cross-chain deposit with bridging from all chains
    private async crossChainDepositToVault(
        vaultConfig: VaultConfig,
        amount: string,
        multiChainWalletData: MultiChainWalletData
    ): Promise<{ success: boolean; transactionHash: string; crossChain: true; consolidationTxs: string[] }> {
        try {
            const requestedAmount = parseFloat(amount);

            // Get balances across all chains
            const allBalances = await this.getAllChainBalances('USDC');
            console.log('Chain balances for vault deposit:', allBalances);

            const scrollBalance = allBalances.find(b => b.chain === 'scroll')?.balance || 0;
            const otherChainBalances = allBalances.filter(b => b.chain !== 'scroll');
            const totalBalance = allBalances.reduce((sum, b) => sum + b.balance, 0);

            if (totalBalance < requestedAmount) {
                throw new Error(`Insufficient total balance. Available: ${totalBalance}, requested: ${requestedAmount}`);
            }

            const scrollChainData = multiChainWalletData['scroll'];

            if (!scrollChainData?.smartAccount || !scrollChainData.smartAccountAddress) {
                throw new Error('Smart accounts not available for cross-chain vault deposit');
            }

            // Check if this is a max deposit (user wants to deposit everything available)
            const isMaxDeposit = Math.abs(requestedAmount - totalBalance) < 0.0001;
            console.log(`Request: ${requestedAmount} USDC, Total available: ${totalBalance} USDC, Is max deposit: ${isMaxDeposit}`);

            let consolidationTxs: string[] = [];
            let totalBridgedAmount = 0;
            const bridgeErrors: string[] = [];

            // Bridge funds from all chains with balance
            for (const { chain, balance } of otherChainBalances) {
                console.log(`💰 Bridging ${balance} USDC from ${chain} to Scroll...`);

                try {
                    // For vault deposits, we need to use the multicall handler
                    // So we'll bridge to Scroll first, then do a separate deposit
                    const bridgeTx = await this.transferBetweenChains(
                        chain,
                        'scroll',
                        'USDC',
                        balance.toString(),
                        multiChainWalletData
                    );

                    consolidationTxs.push(bridgeTx);
                    totalBridgedAmount += balance;

                } catch (bridgeError) {
                    console.error(`Error bridging from ${chain}:`, bridgeError);
                    
                    // Collect specific error messages
                    if (bridgeError instanceof Error) {
                        bridgeErrors.push(bridgeError.message);
                    } else if (typeof bridgeError === 'string') {
                        bridgeErrors.push(bridgeError);
                    } else {
                        bridgeErrors.push(`Unknown error bridging from ${chain}`);
                    }
                    
                    // Continue with other chains
                }
            }

            if (totalBridgedAmount === 0 && scrollBalance < requestedAmount) {
                // If we have specific bridge errors, use the first one (likely the most relevant)
                if (bridgeErrors.length > 0) {
                    throw new Error(bridgeErrors[0]);
                }
                throw new Error('Failed to bridge funds from any chain');
            }

            // Wait for bridges to complete and then deposit
            console.log(`⏳ Waiting for bridge transactions to complete...`);

            // Create a Promise that resolves when deposit is confirmed
            const waitForDepositCompletion = new Promise<{ success: boolean; transactionHash: string; crossChain: true; consolidationTxs: string[] }>((resolve, reject) => {
                let pollCount = 0;
                const maxPolls = 20; // Poll for up to ~5 minutes
                const pollInterval = 10000; // 10 seconds between polls

                const scrollConfig = getChainConfig('scroll');
                const publicClient = createPublicClient({
                    chain: scrollConfig.chain,
                    transport: scrollConfig.secureTransport
                });

                const checkInterval = setInterval(async () => {
                    pollCount++;
                    console.log(`Polling for bridged funds (${pollCount}/${maxPolls})...`);

                    try {
                        const scrollBalanceWei = await publicClient.readContract({
                            address: scrollConfig.tokens.usdc as `0x${string}`,
                            abi: ERC20_ABI,
                            functionName: "balanceOf",
                            args: [scrollChainData.smartAccountAddress as `0x${string}`],
                        }) as bigint;

                        const currentScrollBalance = parseFloat(formatUnits(scrollBalanceWei, 6));
                        console.log(`Current Scroll USDC balance: ${currentScrollBalance}`);

                        // Check if we have enough balance for the deposit
                        const expectedBalance = scrollBalance + totalBridgedAmount;
                        if (currentScrollBalance >= expectedBalance * 0.9) { // 90% threshold
                            console.log(`Funds detected on Scroll! Executing vault deposit...`);
                            clearInterval(checkInterval);

                            try {
                                // Execute vault deposit
                                const depositAmount = isMaxDeposit ?
                                    currentScrollBalance.toString() :
                                    requestedAmount.toString();

                                const depositResult = await this.directDepositToVault(
                                    vaultConfig,
                                    depositAmount,
                                    multiChainWalletData
                                );

                                if (depositResult.success) {
                                    console.log(`✅ Vault deposit successful! Hash: ${depositResult.transactionHash}`);
                                    resolve({
                                        success: true,
                                        transactionHash: depositResult.transactionHash,
                                        crossChain: true,
                                        consolidationTxs: [...consolidationTxs, depositResult.transactionHash],
                                    });
                                } else {
                                    console.error("❌ Vault deposit failed");
                                    reject(new Error("Vault deposit failed"));
                                }

                            } catch (error) {
                                console.error("Error in vault deposit:", error);
                                reject(error);
                            }
                            return;
                        }

                    } catch (error) {
                        console.error("Error in polling for bridged funds:", error);
                    }

                    // Stop polling after max attempts
                    if (pollCount >= maxPolls) {
                        console.log("Max polling attempts reached. Stopping polls.");
                        clearInterval(checkInterval);
                        reject(new Error("Timeout waiting for bridged funds"));
                    }
                }, pollInterval);
            });

            // Wait for the deposit to actually complete before returning
            return await waitForDepositCompletion;

        } catch (error) {
            console.error("Error in cross-chain vault deposit:", error);
            throw error;
        }
    }

    async withdrawFromVault(
        vaultId: string,
        amount: string,
        multiChainWalletData: MultiChainWalletData
    ): Promise<{
        success: boolean;
        transactionHash: string;
        consolidationTxs: string[];
    }> {
        try {
            // 1. Get vault configuration
            const vaultConfig = getVaultConfig(vaultId);
            if (!vaultConfig) {
                throw new Error(`Unknown vault ID: ${vaultId}`);
            }

            if (!vaultConfig.isActive) {
                throw new Error(`Vault ${vaultConfig.name} is not yet active`);
            }

            // 2. Get current user vault balances from the wallet API summary instead of calling userAPI directly
            // This avoids the issue of calling getUserData with null privy user and wrong data structure
            const walletSummary = walletAPI.getMultiChainSummary();
            if (!walletSummary?.smartAccountAddress) {
                throw new Error("Smart account address not available for withdrawal");
            }

            // Get vault balances directly using the wallet API's cached summary
            const userData = await userAPI.getAggregatedVaultBalanceForScroll(walletSummary.smartAccountAddress);

            const virtualVaultBalance = parseFloat(userData.virtualVault?.withdrawableUsdc || "0");
            const combinedVaultBalance = parseFloat(userData.combinedVault?.withdrawableUsdc || "0");
            const totalAvailable = virtualVaultBalance + combinedVaultBalance;
            const requestedAmount = parseFloat(amount);

            console.log(`Smart withdrawal: ${requestedAmount} USDC requested`);
            console.log(`Available: VV=${virtualVaultBalance}, CV=${combinedVaultBalance}, Total=${totalAvailable}`);

            if (requestedAmount > totalAvailable) {
                throw new Error(`Insufficient balance. Requested: ${requestedAmount}, Available: ${totalAvailable}`);
            }

            // 3. Determine withdrawal strategy (same logic as MainnetTransactionProvider)
            const scrollChainData = multiChainWalletData['scroll'];
            if (!scrollChainData?.smartAccount) {
                throw new Error('Scroll smart account not available for withdrawal');
            }

            const transactions = [];
            let amountFromVV = 0;
            let amountFromCV = 0;

            if (requestedAmount <= virtualVaultBalance) {
                // Withdraw everything from Virtual Vault
                amountFromVV = requestedAmount;
                console.log(`Strategy: Withdraw ${amountFromVV} from Virtual Vault only`);
            } else {
                // Withdraw all from Virtual Vault, remainder from Combined Vault
                amountFromVV = virtualVaultBalance;
                amountFromCV = requestedAmount - virtualVaultBalance;
                console.log(`Strategy: Withdraw ${amountFromVV} from VV, ${amountFromCV} from CV`);
            }

            // 4. Prepare withdrawal transactions
            const consolidationTxs: string[] = [];

            // Virtual Vault withdrawal
            if (amountFromVV > 0) {
                const vvAmountInWei = parseUnits(amountFromVV.toFixed(6), 6);
                const vvWithdrawCalldata = encodeFunctionData({
                    abi: vaultConfig.virtualVaultAbi,
                    functionName: vaultConfig.withdrawMethod,
                    args: [vvAmountInWei, scrollChainData.smartAccountAddress, scrollChainData.smartAccountAddress],
                });

                const vvTxHash = await scrollChainData.smartAccount.sendTransaction({
                    to: vaultConfig.virtualVaultAddress,
                    data: vvWithdrawCalldata,
                });

                console.log(`Virtual Vault withdrawal: ${vvTxHash}`);
                consolidationTxs.push(vvTxHash);
            }

            // Combined Vault withdrawal
            if (amountFromCV > 0) {
                const cvAmountInWei = parseUnits(amountFromCV.toFixed(6), 6);
                const cvWithdrawCalldata = encodeFunctionData({
                    abi: vaultConfig.combinedVaultAbi,
                    functionName: vaultConfig.withdrawMethod,
                    args: [cvAmountInWei, scrollChainData.smartAccountAddress, scrollChainData.smartAccountAddress],
                });

                const cvTxHash = await scrollChainData.smartAccount.sendTransaction({
                    to: vaultConfig.combinedVaultAddress,
                    data: cvWithdrawCalldata,
                });

                console.log(`Combined Vault withdrawal: ${cvTxHash}`);
                consolidationTxs.push(cvTxHash);
            }

            const finalTransactionHash = consolidationTxs[consolidationTxs.length - 1];
            console.log(`✅ Smart withdrawal completed. Final hash: ${finalTransactionHash}`);

            return {
                success: true,
                transactionHash: finalTransactionHash,
                consolidationTxs,
            };

        } catch (error) {
            console.error(`Error withdrawing from vault ${vaultId}:`, error);
            throw error;
        }
    }

    // Add this new method to get total yield
    async getTotalYieldEarned(walletAddress: string, getAccessToken?: () => Promise<string>): Promise<number> {
        try {
            console.log(`Fetching total yield for ${walletAddress}`);

            // Get all yield transactions without pagination by setting a large page size
            // or better yet, add a specific endpoint for total yield
            let allYieldTransactions: Transaction[] = [];
            let page = 1;
            const pageSize = 100; // Larger page size to reduce API calls
            let hasMore = true;

            while (hasMore) {
                let response: Response;
                
                if (getAccessToken) {
                    const token = await getAccessToken();
                    response = await fetch(
                        `/api/wallets/${walletAddress}/transactions?page_size=${pageSize}&page_number=${page}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                            },
                        }
                    );
                } else {
                    // Fallback to direct backend call for backward compatibility
                    response = await fetch(
                        `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/wallets/${walletAddress}/transactions?page_size=${pageSize}&page_number=${page}`
                    );
                }

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }

                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    // Filter only yield (accrue) transactions
                    const yieldTransactions = data.data
                        .filter((tx: any) => tx.transactionType === 'accrue')
                        .map((tx: any) => ({
                            amount: tx.amount,
                        }));

                    allYieldTransactions.push(...yieldTransactions);

                    // Check if we have more data
                    hasMore = data.data.length === pageSize;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            // Calculate total yield
            const totalYield = allYieldTransactions.reduce((sum, tx) => sum + tx.amount, 0);

            console.log(`Total yield calculated: ${totalYield} USDC from ${allYieldTransactions.length} transactions`);
            return totalYield;

        } catch (error) {
            console.error('Error fetching total yield:', error);
            return 0; // Return 0 on error to avoid breaking the UI
        }
    }




    /**
     * Execute token swap using Odos with automatic fee collection
     * @param chainKey - Chain to execute swap on
     * @param inputToken - Input token symbol (ETH, USDC, USDT)
     * @param outputToken - Output token symbol (ETH, USDC, USDT)
     * @param amount - Amount to swap (in token units)
     * @param multiChainWalletData - Multi-chain wallet data
     * @param slippage - Slippage tolerance percentage (default 0.5%)
     * @returns Transaction hash and swap details
     */
    async executeSwap(
        chainKey: SupportedChainKey,
        inputToken: string,
        outputToken: string,
        amount: string,
        multiChainWalletData: MultiChainWalletData,
        slippage: number = 0.5
    ): Promise<{
        success: boolean;
        transactionHash: string;
        quote: any;
        estimatedOutput: string;
        priceImpact: string;
        yourFeeRevenue: string;
    }> {
        try {
            console.log(`🔄 Executing swap: ${amount} ${inputToken} → ${outputToken} on ${chainKey}`);

            const chainData = multiChainWalletData[chainKey];
            if (!chainData?.smartAccount || !chainData?.smartAccountAddress) {
                throw new Error(`Smart account not available for ${chainKey}`);
            }

            // Validate swap is supported
            if (!odosAPI.isSupportedSwap(inputToken, outputToken, chainKey)) {
                throw new Error(`Swap ${inputToken} → ${outputToken} not supported on ${chainKey}`);
            }

            // Step 1: Get quote from Odos with your referral code
            const quote = await odosAPI.getQuote(
                chainKey,
                inputToken,
                outputToken,
                amount,
                chainData.smartAccountAddress,
                slippage
            );

            console.log('📊 Swap quote received:', {
                inputAmount: quote.inAmounts[0],
                outputAmount: quote.outAmounts[0],
                priceImpact: quote.priceImpact,
                gasEstimate: quote.gasEstimate
            });

            // Step 2: Handle token approvals BEFORE assembling transaction (for ERC-20 tokens)
            await this.handleSwapApprovals(
                chainKey,
                inputToken,
                amount,
                chainData
            );

            // Step 3: Assemble transaction
            const assembledTx = await odosAPI.assembleTransaction(
                quote.pathId,
                chainData.smartAccountAddress,
                true // simulate
            );

            console.log('🔍 Simulation result:', assembledTx.simulation);

            if (assembledTx.simulation && !assembledTx.simulation.isSuccess) {
                
                // Check if this is a gas-related failure
                const simulation = assembledTx.simulation as any;
                if (simulation.simulationError && (
                    simulation.simulationError.errorMessage?.includes('insufficient funds') ||
                    simulation.simulationError.message?.includes('gas') ||
                    simulation.simulationError.reason?.includes('gas')
                )) {
                    console.log('🔄 Simulation failed due to gas issues, proceeding anyway...');
                    // Skip simulation check for gas-related failures
                } else {
                    throw new Error('Swap simulation failed - transaction would revert. This might be due to insufficient balance, slippage, or market conditions. Please try again with a smaller amount or higher slippage.');
                }
            }

            // Step 4: Execute swap transaction with higher gas limits
            console.log('🚀 Executing swap transaction...');
            
            // Use higher gas limits to ensure transaction success regardless of gas payment method
            const gasLimit = BigInt(800000); // Higher gas limit for complex swaps
            
            const txHash = await chainData.smartAccount.sendTransaction({
                to: assembledTx.transaction.to as `0x${string}`,
                data: assembledTx.transaction.data as `0x${string}`,
                value: BigInt(assembledTx.transaction.value),
                gas: gasLimit
            });
            
            console.log(`✅ Swap executed successfully: ${txHash}`);

            // Calculate your fee revenue (you get 80% of 0.375% = 0.3%)
            const yourFeeRevenue = odosAPI.calculateYourFeeRevenue(quote.inAmounts[0], inputToken);

            return {
                success: true,
                transactionHash: txHash,
                quote: quote,
                estimatedOutput: odosAPI.formatFromWei(quote.outAmounts[0], outputToken),
                priceImpact: odosAPI.formatPriceImpact(quote.priceImpact),
                yourFeeRevenue: yourFeeRevenue
            };

        } catch (error) {
            console.error('Error executing swap:', error);
            throw error;
        }
    }

    /**
     * Handle token approvals for ERC-20 swaps
     */
    private async handleSwapApprovals(
        chainKey: SupportedChainKey,
        inputToken: string,
        amount: string,
        chainData: any
    ): Promise<void> {
        // ETH swaps don't need approval
        if (inputToken.toLowerCase() === 'eth') {
            return;
        }

        try {
            const chainConfig = getChainConfig(chainKey);
            const odosRouterAddress = chainConfig.odosRouterAddress;

            if (!odosRouterAddress) {
                throw new Error(`Odos router address not configured for ${chainKey}`);
            }

            const tokenAddress = inputToken.toLowerCase() === 'usdc'
                ? chainConfig.tokens.usdc
                : chainConfig.tokens.usdt;

            if (!tokenAddress) {
                throw new Error(`Token ${inputToken} not supported on ${chainKey}`);
            }

            // Get token decimals
            const publicClient = createPublicClient({
                chain: chainConfig.chain,
                transport: chainConfig.secureTransport
            });

            const decimals = await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "decimals",
            }) as number;

            const amountInWei = parseUnits(amount, decimals);

            // Check current allowance
            const currentAllowance = await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "allowance",
                args: [chainData.smartAccountAddress as `0x${string}`, odosRouterAddress as `0x${string}`],
            }) as bigint;

            // Approve if needed
            if (currentAllowance < amountInWei) {
                console.log(`🔓 Approving ${inputToken} for Odos router on ${chainKey}...`);

                const approveCalldata = encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [odosRouterAddress as `0x${string}`, parseUnits("1000000", decimals)], // Large approval
                });

                const approveTx = await chainData.smartAccount.sendTransaction({
                    to: tokenAddress,
                    data: approveCalldata,
                });

                console.log(`✅ Token approved on ${chainKey}: ${approveTx}`);
            }
        } catch (error) {
            console.error(`Error handling token approval for ${chainKey}:`, error);
            throw error;
        }
    }

    /**
     * Get swap quote without executing (for UI display)
     */
    async getSwapQuote(
        chainKey: SupportedChainKey,
        inputToken: string,
        outputToken: string,
        amount: string,
        userAddress: string,
        slippage: number = 0.5
    ): Promise<{
        estimatedOutput: string;
        priceImpact: string;
        gasEstimate: number;
        gasEstimateUSD: number;
        yourFeeRevenue: string;
        minOutput: string;
    }> {
        try {
            if (!odosAPI.isSupportedSwap(inputToken, outputToken, chainKey)) {
                throw new Error(`Swap ${inputToken} → ${outputToken} not supported on ${chainKey}`);
            }

            const quote = await odosAPI.getQuote(
                chainKey,
                inputToken,
                outputToken,
                amount,
                userAddress,
                slippage
            );

            // Calculate your fee revenue (you get 80% of 0.375% = 0.3%)
            const yourFeeRevenue = odosAPI.calculateYourFeeRevenue(quote.inAmounts[0], inputToken);

            return {
                estimatedOutput: odosAPI.formatFromWei(quote.outAmounts[0], outputToken),
                priceImpact: odosAPI.formatPriceImpact(quote.priceImpact),
                gasEstimate: quote.gasEstimate,
                gasEstimateUSD: quote.gasEstimateValue,
                yourFeeRevenue: yourFeeRevenue,
                minOutput: odosAPI.calculateMinOutput(quote.outAmounts[0], slippage)
            };

        } catch (error) {
            console.error('Error getting swap quote:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const transactionAPI = TransactionAPI.getInstance();