import React, { useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, EllipsisVertical, Wallet2, TrendingUp, ArrowLeftRight } from "lucide-react";
import BuyDrawer from "../buy/BuyDrawer";
import TransferDrawer from "../transfer/TransferDrawer";
import { useMultiChainTokenBalances, useTotalAssets, QueryKeys } from "../../lib/hooks";
import { priceAPI } from "../../lib/api/price-api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { useRouter } from "next/navigation";

interface WalletProps {
  onDeposit?: () => void;
  showBuyDrawer: boolean;
  setShowBuyDrawer: (open: boolean) => void;
  showTransferDrawer: boolean;
  setShowTransferDrawer: (open: boolean) => void;
  showWalletBreakdown: boolean;
  setShowWalletBreakdown: (open: boolean) => void;
}

// Function to format number with fixed 3 decimal places for consistency
const formatBalance = (value: number) => {
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const digitsOnly = formatted.replace(/[^0-9]/g, "");
  if (digitsOnly.length > 6) {
    // If more than 6 digits, truncate and add K/M/B suffix
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(3) + "B";
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(3) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(3) + "K";
    }
  }
  return formatted;
};

// WalletBreakdown component
const WalletBreakdown: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const router = useRouter();
  // Use the SAME calculation as useTotalAssets to ensure perfect consistency
  const { walletBreakdown, isLoading: balanceLoading } = useTotalAssets();

  // Use the breakdown data from useTotalAssets for consistent values
  const usdcValue = walletBreakdown?.usdcUSD || 0;
  const ethUSDValue = walletBreakdown?.ethUSD || 0;
  const usdtUSDValue = walletBreakdown?.usdtUSD || 0;
  
  // Get individual token amounts from breakdown (more accurate than userData)
  const usdcAmount = walletBreakdown?.usdcAmount || 0;
  const ethAmount = walletBreakdown?.ethAmount || 0;
  const usdtAmount = walletBreakdown?.usdtAmount || 0;

  // Navigation handlers
  const handleSwapClick = () => {
    onOpenChange(false);
    router.push('/swap');
  };

  // Preload swap page images when wallet breakdown opens
  useEffect(() => {
    if (open) {
      // Preload token images for faster swap page loading
      const tokenIcons = ['/token/eth.png', '/token/usdc.png', '/token/usdt.png'];
      const chainIcons = ['/scroll.png', '/base.png', '/optimism.png', '/arbitrum.png', '/polygon.png'];
      
      [...tokenIcons, ...chainIcons].forEach(src => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, [open]);

  const handleChartClick = (token: string) => {
    // Navigate to in-app token chart page
    router.push(`/chart/${token}`);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-2">
        <DrawerHeader>
          <DrawerTitle className="ml-2 text-xl">Wallet Breakdown</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          {balanceLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <>
              {/* USDC Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/token/usdc.png" alt="USDC" className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">USDC</div>
                      <div className="text-sm text-gray-500">USD Coin</div>
                    </div>

                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${usdcValue.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {usdcAmount.toFixed(3)} USDC
                    </div>
                  </div>
                </div>
              </div>

              {/* ETH Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/token/eth.png" alt="ETH" className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">ETH</div>
                      <div className="text-sm text-gray-500">Ethereum</div>
                    </div>
                    <button
                      onClick={() => handleChartClick('ethereum')}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      title="View ETH chart"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${ethUSDValue.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ethAmount.toFixed(6)} ETH
                    </div>
                  </div>
                </div>
              </div>

              {/* USDT Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/token/usdt.png" alt="USDT" className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">USDT</div>
                      <div className="text-sm text-gray-500">Tether USD</div>
                    </div>

                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${usdtUSDValue.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {usdtAmount.toFixed(3)} USDT
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Swap CTA Button */}
          <div className="px-2 pb-4">
            <Button
              onClick={handleSwapClick}
              className="w-full bg-black text-white rounded-2xl py-5 font-medium text-md hover:bg-gray-800 transition-colors"
              disabled={balanceLoading}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Swap Tokens
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const Wallet: React.FC<WalletProps> = ({
  showBuyDrawer,
  setShowBuyDrawer,
  showTransferDrawer,
  setShowTransferDrawer,
  showWalletBreakdown,
  setShowWalletBreakdown,
}) => {
  // Get total assets including all tokens (USDC, ETH, USDT) converted to USD
  const { walletBalance, isLoading } = useTotalAssets();

  const formattedBalance = formatBalance(walletBalance);

  const handleDeposit = () => {
    setShowBuyDrawer(true);
  };

  const handleTransfer = () => {
    setShowTransferDrawer(true);
  };

  const handleWalletBreakdown = () => {
    setShowWalletBreakdown(true);
  };

  return (
    <>
      <Card className="w-full rounded-3xl border bg-white p-0 shadow-none">
        <CardContent className="flex justify-between items-center gap-6 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Add wallet icon */}
            <button
              onClick={handleWalletBreakdown}
              className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 hover:shadow-md active:bg-gray-200 active:scale-95 transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:shadow-none disabled:active:scale-100"
              disabled={isLoading}
              title="View wallet breakdown"
            >
              <Wallet2 className="w-5 h-5 text-gray-700 hover:text-gray-900 transition-colors" />
            </button>
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-1">
                Wallet balance
              </div>
              <div className="text-xl font-semibold text-black">
                {isLoading ? (
                  <Skeleton className="h-7 w-24 rounded" />
                ) : (
                  `$${formattedBalance}`
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="default"
              className="bg-black text-white rounded-full px-5 py-2 font-medium text-sm min-w-[100px]"
              onClick={handleDeposit}
              disabled={isLoading}
            >
              <Plus className="w-3 h-3" />
              Deposit
            </Button>
            <Button
              className="w-9 h-9 flex items-center justify-center border rounded-full text-black bg-white"
              onClick={handleTransfer}
              disabled={isLoading}
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <BuyDrawer
        open={showBuyDrawer}
        onOpenChange={setShowBuyDrawer}
        onBuyClick={() => setShowBuyDrawer(false)}
      />

      <TransferDrawer
        open={showTransferDrawer}
        onOpenChange={setShowTransferDrawer}
      />

      <WalletBreakdown
        open={showWalletBreakdown}
        onOpenChange={setShowWalletBreakdown}
      />
    </>
  );
};

export default Wallet;
