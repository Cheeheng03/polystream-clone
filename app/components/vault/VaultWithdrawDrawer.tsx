import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  useWithdrawFromVault,
  useVaultPosition,
  useUserData,
} from "../../lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "../ui/toast";

interface VaultWithdrawDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  vaultName: string;
  token?: string;
}

interface ToastProps {
  isVisible: boolean;
  status: "processing" | "success" | "error";
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  isVisible,
  status,
  message,
  onClose,
}) => {
  useEffect(() => {
    if (status === "success" && isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds for success
      return () => clearTimeout(timer);
    }
  }, [status, isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
          }}
          className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg mx-auto max-w-md">
            <div className="flex items-center gap-3 px-6 py-4">
              {status === "processing" && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    damping: 10,
                    stiffness: 400,
                  }}
                  className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}
              {status === "error" && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
              <span className="font-medium text-gray-900 flex-1">
                {message}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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

const VaultWithdrawDrawer: React.FC<VaultWithdrawDrawerProps> = ({
  open,
  onOpenChange,
  vaultId,
  vaultName,
  token = "USDC",
}) => {
  const [amount, setAmount] = useState("");
  const { showToast } = useToast();

  // Use hooks to get real vault data
  const { data: position, isLoading: positionLoading } =
    useVaultPosition(vaultId);
  const { data: userData, isLoading: userDataLoading } = useUserData();
  const withdrawMutation = useWithdrawFromVault();

  // Calculate real redeemable amount using individualVaultBalances for any active vault
  const realRedeemableAmount = userData?.individualVaultBalances?.[vaultId]
    ? parseFloat(userData.individualVaultBalances[vaultId])
    : 0;
  const mockRedeemableAmount = position?.stakedAmount || 0;

  // Use real vault balance if available, otherwise fallback to mock data for inactive vaults
  const redeemableAmount =
    realRedeemableAmount > 0 ? realRedeemableAmount : mockRedeemableAmount;

  // Reset amount when drawer closes
  useEffect(() => {
    if (!open) {
      setAmount("");
    }
  }, [open]);

  const handleMaxClick = () => {
    setAmount(redeemableAmount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      // Close drawer immediately
      onOpenChange(false);

      // Show processing toast
      showToast("processing", "Redeeming");

      // Execute withdrawal
      await withdrawMutation.mutateAsync({
        vaultId,
        amount: parseFloat(amount),
      });

      // Show success toast
      showToast(
        "success",
        `Successfully withdrew ${parseFloat(amount).toFixed(
          2
        )} ${token} from ${vaultName}!`
      );
    } catch (error) {
      console.error("Error withdrawing from vault:", error);

      // Extract the actual error message
      let errorMessage = "Withdrawal failed. Please try again.";
      
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <div className="flex flex-col">
          <DrawerHeader className="pb-2 pt-4">
            <DrawerTitle className="text-center text-lg">
              Redeem {vaultName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
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
                  className="pr-20 h-11 text-lg rounded-xl focus:border-black focus:ring-1 focus:ring-black"
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

            {/* Redeemable Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">
                  Redeemable Amount
                </Label>
                <span className="text-sm font-medium">
                  ${formatBalance(redeemableAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">
                  Est. Redemption Time
                </Label>
                <span className="text-sm font-medium text-green-600">
                  Immediate
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > redeemableAmount
              }
              className="w-full py-2.5 rounded-3xl font-medium h-11"
              variant={
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > redeemableAmount
                  ? "secondary"
                  : "default"
              }
            >
              {parseFloat(amount) > redeemableAmount
                ? "Insufficient Balance"
                : "Confirm"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default VaultWithdrawDrawer;
