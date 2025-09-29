'use client';
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, ArrowLeft, Loader2, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '../ui/toast';
import { 
  useSwapQuote, 
  useExecuteSwap, 
  useSwapValidation, 
  useSwapRoute,
  useSupportedSwapTokens,
  useMultiChainTokenBalances 
} from '../../lib/hooks';
import { SupportedChainKey } from '../../lib/config/chains';
import { priceAPI } from '../../lib/api/price-api';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerOverlay,
} from "../../components/ui/drawer";
import router from 'next/router';

interface SwapInterfaceProps {
  defaultChain?: SupportedChainKey;
  className?: string;
}

// Token configurations with icons, prices, and decimals
const TOKEN_CONFIG = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '/token/eth.png',
    priceKey: 'ETH/USD',
    decimals: 18
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '/token/usdc.png',
    priceKey: 'USDC/USD',
    decimals: 6
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: '/token/usdt.png',
    priceKey: 'USDT/USD',
    decimals: 6
  }
};

const CHAIN_CONFIG: Record<SupportedChainKey, { name: string; icon: string; available: boolean }> = {
  scrollSepolia: { name: 'Scroll Sepolia', icon: '/scroll.png', available: false },
  scroll: { name: 'Scroll', icon: '/scroll.png', available: true },
  base: { name: 'Base', icon: '/base.png', available: true },
  optimism: { name: 'Optimism', icon: '/optimism.png', available: true },
  arbitrum: { name: 'Arbitrum', icon: '/arbitrum.png', available: true },
  polygon: { name: 'Polygon', icon: '/polygon.png', available: true }
};

export default function SwapInterface({ 
  defaultChain = 'scroll', 
  className = '' 
}: SwapInterfaceProps) {
  const { getAccessToken } = usePrivy();
  const { showToast } = useToast();

  // Preload all token images when component mounts
  useEffect(() => {
    const preloadImages = () => {
      Object.values(TOKEN_CONFIG).forEach(config => {
        const img = new window.Image();
        img.src = config.icon;
      });
      
      // Also preload chain icons
      Object.values(CHAIN_CONFIG).forEach(config => {
        const img = new window.Image();
        img.src = config.icon;
      });
    };
    
    preloadImages();
  }, []);
  
  const [selectedChain, setSelectedChain] = useState<SupportedChainKey>(defaultChain);
  const [inputToken, setInputToken] = useState(defaultChain === 'polygon' ? 'USDC' : 'ETH');
  const [outputToken, setOutputToken] = useState(defaultChain === 'polygon' ? 'USDT' : 'USDC');
  const [inputAmount, setInputAmount] = useState('');
  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false);
  const [isChainDrawerOpen, setIsChainDrawerOpen] = useState(false);
  const [selectingInput, setSelectingInput] = useState(true);
  const [tokenPrices, setTokenPrices] = useState<{[key: string]: number}>({});
  const [walletPopupChain, setWalletPopupChain] = useState<string | null>(null);
const router = useRouter();
  
  // Automatic slippage - no user selection needed
  const slippage = 0.5; // Default 0.5% slippage

  // Get supported tokens for current chain
  const supportedTokens = useSupportedSwapTokens(selectedChain);
  
  // Get token balances
  const { data: inputBalances, refetch: refetchInputBalances } = useMultiChainTokenBalances(inputToken);
  const { data: outputBalances, refetch: refetchOutputBalances } = useMultiChainTokenBalances(outputToken);
  const { data: ethBalances, refetch: refetchEthBalances } = useMultiChainTokenBalances('ETH');
  const { data: usdcBalances, refetch: refetchUsdcBalances } = useMultiChainTokenBalances('USDC');
  const { data: usdtBalances, refetch: refetchUsdtBalances } = useMultiChainTokenBalances('USDT');
  
  // Get current balance for input token on selected chain
  const currentBalance = inputBalances?.[selectedChain] || '0';
  
  // Get native token balance for gas fees
  const nativeTokenBalance = selectedChain === 'polygon' 
    ? '1.0' // TODO: Add MATIC balance check when implemented
    : ethBalances?.[selectedChain] || '0';
  
  // Check if native token balance is too low for gas
  const hasInsufficientGas = parseFloat(nativeTokenBalance) < 0.00001;

  // Validation
  const validation = useSwapValidation(selectedChain, inputToken, outputToken, inputAmount);
  
  // Swap route info
  const swapRoute = useSwapRoute(inputToken, outputToken, selectedChain);
  
  // Quote query (only enabled when amount > 0 and validation passes)
  const shouldFetchQuote = useMemo(() => {
    return parseFloat(inputAmount || '0') > 0 && validation.isValid;
  }, [inputAmount, validation.isValid]);
  
  const { 
    data: quote, 
    isLoading: isQuoteLoading, 
    error: quoteError,
    refetch: refetchQuote 
  } = useSwapQuote(
    selectedChain,
    inputToken,
    outputToken,
    inputAmount,
    shouldFetchQuote
  );
  
  // Execute swap mutation
  const executeSwap = useExecuteSwap();

  // Fetch token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Set up authentication for priceAPI
        priceAPI.setAccessTokenGetter(async () => {
          const token = await getAccessToken();
          if (!token) throw new Error('No access token available');
          return token;
        });
        
        const prices = await priceAPI.getPrices(['ETH/USD', 'USDC/USD', 'USDT/USD']);
        setTokenPrices(prices);
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
      }
    };
    fetchPrices();
  }, [getAccessToken]);

  // Auto-refetch quote every 15 seconds
  useEffect(() => {
    if (!shouldFetchQuote) return;
    
    const interval = setInterval(() => {
      refetchQuote();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [shouldFetchQuote, refetchQuote]);

  // Handle token swap (flip input/output)
  const handleTokenSwap = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(''); // Clear amount when swapping
  };

  // Handle max button
  const handleMaxAmount = () => {
    setInputAmount(currentBalance);
  };

  // Handle token selection
  const handleTokenSelect = (token: string) => {
    if (selectingInput) {
      if (token === outputToken) {
        // If selecting the same token as output, swap them
        setOutputToken(inputToken);
      }
      setInputToken(token);
    } else {
      if (token === inputToken) {
        // If selecting the same token as input, swap them
        setInputToken(outputToken);
      }
      setOutputToken(token);
    }
    setIsTokenDrawerOpen(false);
    setInputAmount(''); // Clear amount when changing tokens
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!validation.isValid || !quote) return;
    
    try {
      // Show processing toast
      showToast("processing", "Swapping");

      const result = await executeSwap.mutateAsync({
        chainKey: selectedChain,
        inputToken,
        outputToken,
        amount: inputAmount,
        slippage
      });
      
      console.log(`✅ Swap completed successfully: ${result.transactionHash}`);
      
      // Show success toast
      showToast(
        "success",
        `Successfully swapped ${parseFloat(inputAmount).toFixed(6)} ${inputToken} for ${outputToken}!`
      );
      
      // Immediately refetch balances to show updated amounts
      await Promise.all([
        refetchInputBalances(),
        refetchOutputBalances(),
        refetchEthBalances(),
        refetchUsdcBalances(),
        refetchUsdtBalances()
      ]);
      
      console.log('✅ Balances refreshed in swap interface');
      
      // Reset form on success
      setInputAmount('');
      
      // Redirect to portfolio page after successful swap
      router.push('/portfolio');
      
    } catch (error) {
      console.error('Swap failed:', error);
      
      // Extract the actual error message
      let errorMessage = "Swap failed. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      }

      // Show error toast with actual error message
      showToast("error", errorMessage);
    }
  };

  // Calculate USD values
  const getUSDValue = (amount: string, token: string) => {
    const price = tokenPrices[TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG]?.priceKey];
    if (!price || !amount) return '$0.00';
    const value = parseFloat(amount) * price;
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format quote output amount - handle both raw and formatted amounts
  const formatQuoteOutput = (amount: string | number, token: string) => {
    if (!amount || !token) return '0';
    
    try {
      // If it's already a decimal number (like 0.004853180672235307), just format it
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numAmount)) return '0';
      
      // Return formatted to 6 decimal places
      return numAmount.toFixed(6);
    } catch (error) {
      console.error('Error formatting quote output:', error);
      return '0';
    }
  };

  // Get button text and state
  const getButtonState = () => {
    if (executeSwap.isPending) {
      return {
        text: `Swap ${inputToken} for ${outputToken}`,
        disabled: true,
        showLoader: false
      };
    }

    if (parseFloat(inputAmount || '0') <= 0) {
      return {
        text: 'Enter Amount',
        disabled: true,
        showLoader: false
      };
    }

    if (!validation.isValid) {
      return {
        text: 'Enter Amount',
        disabled: true,
        showLoader: false
      };
    }

    if (isQuoteLoading) {
      return {
        text: 'Getting Quote...',
        disabled: true,
        showLoader: true
      };
    }

    if (quoteError) {
      return {
        text: 'Quote Failed - Try Again',
        disabled: true,
        showLoader: false
      };
    }

    if (!quote) {
      return {
        text: 'Get Quote',
        disabled: true,
        showLoader: false
      };
    }

    return {
      text: `Swap ${inputToken} for ${outputToken}`,
      disabled: false,
      showLoader: false
    };
  };

  const buttonState = getButtonState();

  // Helper function to get token balance for a specific chain
  const getTokenBalanceForChain = (chain: SupportedChainKey, token: string) => {
    if (token === 'ETH') {
      return ethBalances?.[chain] || '0';
    } else if (token === 'USDC') {
      return usdcBalances?.[chain] || '0';
    } else if (token === 'USDT') {
      return usdtBalances?.[chain] || '0';
    }
    return '0';
  };

  // Helper function to get available tokens for a chain
  const getTokensForChain = (chain: SupportedChainKey) => {
    if (chain === 'polygon') {
      return ['USDC', 'USDT'];
    }
    return ['ETH', 'USDC', 'USDT'];
  };

  // Update default tokens when chain changes (only trigger on chain change, not token change)
  useEffect(() => {
    if (selectedChain === 'polygon') {
      // For Polygon, default to USDC → USDT only if currently showing ETH
      if (inputToken === 'ETH') {
        setInputToken('USDC');
        setOutputToken('USDT');
      }
    }
    // Remove the automatic reversion logic - let users choose any valid pair
  }, [selectedChain]); // Only depend on selectedChain, not inputToken/outputToken

    return (
        <motion.div
            className={`max-w-md mx-auto overflow-hidden ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Main content with blur effect */}
            <div 
                className={`transition-all duration-200 ${
                    isChainDrawerOpen || isTokenDrawerOpen ? "blur-sm" : ""
                }`}
            >
                {/* Header with Back Button */}
                <div className="flex items-center p-4 flex-shrink-0">
                    <button
                        className="mr-2 p-2 rounded-full"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-6 h-6 text-primary" />
                    </button>
                    <h1 className="text-lg font-bold ml-2">Swap</h1>
                </div>

                {/* Content */}
                <div className="p-6 pb-4">
                    {/* Network Selector Button */}
                    <button 
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors mb-4"
                        onClick={() => setIsChainDrawerOpen(true)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                    src={CHAIN_CONFIG[selectedChain].icon}
                                    alt={CHAIN_CONFIG[selectedChain].name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                    priority
                                    loading="eager"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">
                                    {CHAIN_CONFIG[selectedChain].name}
                                    {CHAIN_CONFIG[selectedChain].available && (
                                        <span className="ml-2 text-green-600">✓</span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">Network</div>
                            </div>
                        </div>
                        <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Swap Container */}
                <div className="px-6">
                    {/* Input Token */}
                    <div className="rounded-2xl border border-gray-200 p-4 mb-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600">From</span>
                            <span className="text-sm text-gray-500">
                                Balance: {parseFloat(currentBalance).toFixed(6)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => {
                                    setSelectingInput(true);
                                    setIsTokenDrawerOpen(true);
                                }}
                                className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                                disabled={executeSwap.isPending}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                    <Image
                                        src={TOKEN_CONFIG[inputToken as keyof typeof TOKEN_CONFIG].icon}
                                        alt={TOKEN_CONFIG[inputToken as keyof typeof TOKEN_CONFIG].name}
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                        priority
                                        loading="eager"
                                    />
                                </div>
                                <span className="font-medium text-gray-900">{inputToken}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className="flex-1">
                                <input
                                    type="number"
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full text-2xl font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
                                    disabled={executeSwap.isPending}
                                />
                                <div className="text-sm text-gray-500 mt-1">
                                    {inputAmount ? getUSDValue(inputAmount, inputToken) : '$0.00'}
                                </div>
                            </div>

                            <button
                                onClick={handleMaxAmount}
                                className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                disabled={executeSwap.isPending}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center my-4">
                        <button
                            onClick={handleTokenSwap}
                            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                            disabled={executeSwap.isPending}
                        >
                            <ArrowUpDown className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Output Token */}
                    <div className="rounded-2xl border border-gray-200 p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600">To</span>
                            <span className="text-sm text-gray-500">
                                Balance: {parseFloat(outputBalances?.[selectedChain] || '0').toFixed(6)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => {
                                    setSelectingInput(false);
                                    setIsTokenDrawerOpen(true);
                                }}
                                className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                                disabled={executeSwap.isPending}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                    <Image
                                        src={TOKEN_CONFIG[outputToken as keyof typeof TOKEN_CONFIG].icon}
                                        alt={TOKEN_CONFIG[outputToken as keyof typeof TOKEN_CONFIG].name}
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                        priority
                                        loading="eager"
                                    />
                                </div>
                                <span className="font-medium text-gray-900">{outputToken}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className="flex-1">
                                <div className="text-2xl font-medium text-gray-900">
                                    {isQuoteLoading ? (
                                        <div className="flex items-center">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span className="text-gray-500">Getting quote...</span>
                                        </div>
                                    ) : quote ? (
                                        formatQuoteOutput(quote.estimatedOutput, outputToken)
                                    ) : (
                                        <span className="text-gray-400">0</span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {quote ? getUSDValue(formatQuoteOutput(quote.estimatedOutput, outputToken), outputToken) : '$0.00'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Execute Button */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleSwap}
                        disabled={buttonState.disabled}
                        className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${buttonState.disabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-black hover:bg-gray-800 text-white active:scale-95'
                            }`}
                    >
                        {buttonState.showLoader ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                {buttonState.text}
                            </div>
                        ) : (
                            buttonState.text
                        )}
                    </button>
                </div>
            </div>

            {/* Network Selector Drawer - Outside blur wrapper */}
            <Drawer open={isChainDrawerOpen} onOpenChange={setIsChainDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-lg font-semibold">Select Network</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-2">
                        {Object.entries(CHAIN_CONFIG)
                            .filter(([chainKey]) => chainKey !== 'scrollSepolia') // Hide testnet
                            .map(([chainKey, config]) => (
                                <div
                                    key={chainKey}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors relative ${selectedChain === chainKey
                                            ? "bg-blue-50 border border-blue-200"
                                            : "hover:bg-gray-50 border border-transparent"
                                        }`}
                                >
                                    <button
                                        className="flex items-center space-x-3 flex-1"
                                        onClick={() => {
                                            setSelectedChain(chainKey as SupportedChainKey);
                                            setIsChainDrawerOpen(false);
                                        }}
                                        disabled={!config.available}
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <Image
                                                src={config.icon}
                                                alt={config.name}
                                                width={40}
                                                height={40}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-medium ${config.available ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {config.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {config.available ? 'Available' : 'Register Code'}
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                        {config.available && selectedChain === chainKey && (
                                            <span className="text-green-600">✓</span>
                                        )}
                                        {config.available && (
                                            <div className="relative">
                                                <button
                                                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                                    onMouseEnter={() => setWalletPopupChain(chainKey)}
                                                    onMouseLeave={() => setWalletPopupChain(null)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setWalletPopupChain(walletPopupChain === chainKey ? null : chainKey);
                                                    }}
                                                >
                                                    <Wallet className="w-4.5 h-4.5 text-gray-600" />
                                                </button>
                                                
                                                {/* Balance Popup */}
                                                {walletPopupChain === chainKey && (
                                                    <div className={`absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px] z-50 ${
                                                        chainKey === 'polygon' ? 'bottom-8' : 'top-8'
                                                    }`}>
                                                        <div className="text-xs font-medium text-gray-700 mb-2">Balances</div>
                                                        <div className="space-y-1">
                                                            {getTokensForChain(chainKey as SupportedChainKey).map((token) => {
                                                                const balance = getTokenBalanceForChain(chainKey as SupportedChainKey, token);
                                                                return (
                                                                    <div key={token} className="flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-4 h-4 rounded-full overflow-hidden">
                                                                                <Image
                                                                                    src={TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG].icon}
                                                                                    alt={token}
                                                                                    width={16}
                                                                                    height={16}
                                                                                    className="object-contain"
                                                                                />
                                                                            </div>
                                                                            <span className="text-gray-600">{token}</span>
                                                                        </div>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {parseFloat(balance).toFixed(4)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Token Selection Drawer - Outside blur wrapper */}
            <Drawer open={isTokenDrawerOpen} onOpenChange={setIsTokenDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-lg font-semibold">
                            Select {selectingInput ? 'Input' : 'Output'} Token
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-2">
                        {supportedTokens.map((token) => {
                            const config = TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG];
                            const price = tokenPrices[config.priceKey];
                            
                            // Get balance for this token on the selected chain
                            const getTokenBalance = () => {
                                if (token === 'ETH') {
                                    return ethBalances?.[selectedChain] || '0';
                                } else if (token === 'USDC') {
                                    return usdcBalances?.[selectedChain] || '0';
                                } else if (token === 'USDT') {
                                    return usdtBalances?.[selectedChain] || '0';
                                }
                                return '0';
                            };
                            
                            const balance = getTokenBalance();
                            const formattedBalance = parseFloat(balance).toFixed(6);

                            return (
                                <button
                                    key={token}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${(selectingInput ? inputToken : outputToken) === token
                                            ? "bg-blue-50 border border-blue-200"
                                            : "hover:bg-gray-50 border border-transparent"
                                        }`}
                                    onClick={() => handleTokenSelect(token)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <Image
                                                src={config.icon}
                                                alt={config.name}
                                                width={40}
                                                height={40}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-gray-900">{config.name}</div>
                                            <div className="text-sm text-gray-500">{config.symbol}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-900">
                                            {formattedBalance} {config.symbol}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {price && parseFloat(balance) > 0 
                                                ? `$${(parseFloat(balance) * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : '$0.00'
                                            }
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </DrawerContent>
            </Drawer>
        </motion.div>
    );
}