import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useWallet,
  useDepositToVault,
  QueryKeys,
  useTotalAssets,
} from "../../lib/hooks";
import { useToast } from "../ui/toast";

interface VaultBuyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultName: string;
  vaultId: string;
  vaultApy: number;
  token?: string;
}

const formatBalance = (value: number) => {
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const digitsOnly = formatted.replace(/[^0-9]/g, "");
  if (digitsOnly.length > 6) {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(2) + "B";
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + "K";
    }
  }
  return formatted;
};

const VaultBuyDrawer: React.FC<VaultBuyDrawerProps> = ({
  open,
  onOpenChange,
  vaultName,
  vaultId,
  token = "USDC",
}) => {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const router = useRouter();

  // OPTIMIZED: Use same data source as home page (useTotalAssets) instead of useUserData
  const depositMutation = useDepositToVault();
  const { totalAssets, walletBalance, vaultBalance, walletBreakdown, isLoading: totalAssetsLoading } = useTotalAssets();

  // For vault investments, show only USDC balance since that's what can be invested
  const usdcBalance = walletBreakdown?.usdcUSD || 0;
  const realWalletBalance = usdcBalance; // Use USDC balance for vault investments

  // Use vault balance from totalAssets for current position
  const currentPosition = vaultBalance || 0;

  // Reset amount when drawer closes
  useEffect(() => {
    if (!open) {
      setAmount("");
    }
  }, [open]);

  const handleMaxClick = () => {
    setAmount(realWalletBalance.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // Check if insufficient balance and redirect to buy page
    if (parseFloat(amount) > realWalletBalance) {
      onOpenChange(false);
      router.push('/buy');
      return;
    }

    // Close drawer immediately for better UX
    onOpenChange(false);

    try {
      // Show processing toast
      showToast("processing", "Investing");

      // Call the actual deposit mutation - it handles success and query invalidation
      await depositMutation.mutateAsync({
        vaultId,
        amount: amount, // Keep as string
      });

      // Show success toast after mutation completes
      showToast("success", `Successfully invested ${parseFloat(amount).toFixed(2)} USDC in ${vaultName}!`);
      
    } catch (error) {
      console.error("Error depositing to vault:", error);

      // Extract the actual error message
      let errorMessage = "Investment failed. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      // Show error toast with actual error message
      showToast("error", errorMessage);
    }
  };

  // Calculate times
  const now = new Date();
  const orderTime = now.toLocaleTimeString();
  const yieldStartTime = new Date(
    now.getTime() + 24 * 60 * 60 * 1000
  ).toLocaleTimeString();
  const yieldAccrualTime = new Date(
    now.getTime() + 12 * 60 * 60 * 1000
  ).toLocaleTimeString();
  const yieldDistributionTime = new Date(
    now.getTime() + 24 * 60 * 60 * 1000
  ).toLocaleTimeString();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100dvh]">
        <div className="h-full flex flex-col">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center text-lg">
              Invest {vaultName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 px-4 pb-6 space-y-8">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="pr-20 h-12 text-lg rounded-xl"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-black"
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">Wallet Balance</Label>
                <span className="text-sm font-medium">
                  ${formatBalance(realWalletBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">Total Invested</Label>
                <span className="text-sm font-medium">
                  ${formatBalance(currentPosition)}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Timeline</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-sm text-gray-500">Order Time</Label>
                  <span className="text-sm">{orderTime}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-sm text-gray-500">
                    Yield Start Time
                  </Label>
                  <span className="text-sm">{yieldStartTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="m-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
              />
            </svg>
            If you are investing with funds from other chains (Base, Polygon, Optimism, Arbitrum), a 0.15% fee will be charged for bridging to Scroll. Please acknowledge before confirming.
          </div>

          {/* Action Button */}
          <div className="p-4">
            <Button
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0
              }
              className="w-full py-3 rounded-3xl font-medium h-12"
              variant={
                !amount ||
                parseFloat(amount) <= 0
                  ? "secondary"
                  : "default"
              }
            >
              {parseFloat(amount) > realWalletBalance
                ? "Insufficient Balance - Top Up Now"
                : "Confirm"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default VaultBuyDrawer;