"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useWithdrawToEOA, useMultiChainTokenBalances } from "../lib/hooks";
import { getEnabledTokens } from "@/app/lib/config/select-token";
import { useToast } from "../components/ui/toast";
import TokenSelectDrawer from "../components/withdraw/TokenSelectDrawer";

// Only get enabled tokens
const TOKENS = getEnabledTokens();

export default function SendPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fontSize, setFontSize] = useState("text-5xl");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const pasteInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const { mutate: withdrawToEOA, isPending: isWithdrawing } =
    useWithdrawToEOA();

  // Get multi-chain balances for selected token
  const { data: tokenBalances, isLoading: isLoadingBalances } =
    useMultiChainTokenBalances(selectedToken.symbol);

  // Get balances for all tokens to show in the drawer
  const { data: usdcBalances, isLoading: isLoadingUSDC } =
    useMultiChainTokenBalances("USDC");
  const { data: ethBalances, isLoading: isLoadingETH } =
    useMultiChainTokenBalances("ETH");
  const { data: usdtBalances, isLoading: isLoadingUSDT } =
    useMultiChainTokenBalances("USDT");

  // Calculate total available balance across all chains
  const getTotalBalance = () => {
    if (!tokenBalances) return "0";
    return Object.values(tokenBalances)
      .reduce((sum, balance) => sum + parseFloat(balance), 0)
      .toFixed(6); // Keep full precision for all tokens
  };

  // Helper function to get total balance for any token
  const getTotalBalanceForToken = (tokenSymbol: string) => {
    let balances;
    let isLoading;

    switch (tokenSymbol) {
      case "USDC":
        balances = usdcBalances;
        isLoading = isLoadingUSDC;
        break;
      case "ETH":
        balances = ethBalances;
        isLoading = isLoadingETH;
        break;
      case "USDT":
        balances = usdtBalances;
        isLoading = isLoadingUSDT;
        break;
      default:
        return "0";
    }

    if (isLoading) return "...";
    if (!balances) return "0";

    return Object.values(balances)
      .reduce((sum, balance) => sum + parseFloat(balance), 0)
      .toFixed(6); // Keep full precision for all tokens
  };

  // Get balance breakdown by chain
  const getBalanceBreakdown = () => {
    if (!tokenBalances) return [];
    return Object.entries(tokenBalances)
      .filter(([_, balance]) => parseFloat(balance) > 0)
      .map(([chain, balance]) => ({ chain, balance }));
  };

  // Get Scroll balance specifically
  const getScrollBalance = () => {
    if (!tokenBalances) return "0";
    return tokenBalances.scroll || "0";
  };

  // Check if withdrawal would require bridging from Base
  const wouldRequireBridging = () => {
    if (!amount || !tokenBalances) return false;
    const scrollBalance = parseFloat(getScrollBalance());
    const withdrawAmount = parseFloat(amount);
    return withdrawAmount > scrollBalance;
  };

  // Get the amount that would need to be bridged from Base
  const getAmountToBridgeFromBase = () => {
    if (!amount || !tokenBalances) return 0;
    const scrollBalance = parseFloat(getScrollBalance());
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= scrollBalance) return 0;
    return withdrawAmount - scrollBalance;
  };

  // Check if the amount to bridge from Base is too small
  const isBridgeAmountTooSmall = () => {
    const bridgeAmount = getAmountToBridgeFromBase();
    return bridgeAmount > 0 && bridgeAmount < 2;
  };

  // Enhanced function to check if any ETH bridge amounts would be too small
  const getEthBridgeWarning = () => {
    if (!amount || !tokenBalances || selectedToken.symbol !== "ETH")
      return null;

    const withdrawAmount = parseFloat(amount);
    const scrollBalance = parseFloat(getScrollBalance());

    if (withdrawAmount <= scrollBalance) return null; // No bridging needed

    const remainingNeeded = withdrawAmount - scrollBalance;
    const balanceBreakdown = getBalanceBreakdown();
    const otherChainBalances = balanceBreakdown.filter(
      (b) => b.chain !== "scroll"
    );

    let tempRemaining = remainingNeeded;
    const smallBridgeAmounts: Array<{ chain: string; amount: number }> = [];

    for (const { chain, balance } of otherChainBalances) {
      if (tempRemaining <= 0) break;

      const bridgeAmount = Math.min(tempRemaining, parseFloat(balance));
      if (bridgeAmount > 0 && bridgeAmount < 0.005) {
        // Conservative threshold for ETH
        smallBridgeAmounts.push({ chain, amount: bridgeAmount });
      }
      tempRemaining -= bridgeAmount;
    }

    if (smallBridgeAmounts.length > 0) {
      return {
        type: "bridge-amount-warning" as const,
        message: `Warning: Some bridge amounts may be too small for fees (${smallBridgeAmounts
          .map((b) => `${b.amount.toFixed(6)} ETH from ${b.chain}`)
          .join(", ")}). Consider withdrawing a larger amount.`,
        smallAmounts: smallBridgeAmounts,
      };
    }

    return null;
  };

  // Function to format number with accounting format
  const formatAmount = (value: string) => {
    if (!value) return "";
    const cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");
    const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
  };

  // Function to calculate font size based on input length
  const calculateFontSize = (value: string) => {
    const length = value.replace(/[^0-9]/g, "").length;
    if (length > 8) return "text-2xl";
    if (length > 6) return "text-3xl";
    if (length > 4) return "text-4xl";
    return "text-5xl";
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (digitsOnly.length > 10) {
      const truncatedValue = digitsOnly.slice(0, 10);
      const decimalPart = value.includes(".") ? value.split(".")[1] : "";
      setAmount(
        decimalPart ? `${truncatedValue}.${decimalPart}` : truncatedValue
      );
    } else {
      setAmount(value);
    }
    setFontSize(calculateFontSize(value));
    // Clear error when user modifies amount
    if (errorMessage) setErrorMessage("");
  };

  const handleMax = () => {
    const maxValue = getTotalBalance();
    const digitsOnly = maxValue.replace(/[^0-9]/g, "");
    if (digitsOnly.length > 10) {
      setAmount(digitsOnly.slice(0, 10));
    } else {
      setAmount(maxValue);
    }
    setFontSize(calculateFontSize(maxValue));
  };

  const handlePasteInput = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      setAddress(pastedText);
    }
  };

  const handleTokenSelect = (token: (typeof TOKENS)[0]) => {
    setSelectedToken(token);
    setIsDrawerOpen(false);
  };

  const handleWithdraw = () => {
    if (!amount || !address) return;

    console.log("Starting withdrawal...", {
      amount,
      token: selectedToken.symbol,
      address,
    });

    // Clear any existing error message
    setErrorMessage("");

    // Show processing toast
    showToast("processing", "Withdrawing");

    withdrawToEOA(
      {
        token: selectedToken.symbol,
        amount: amount,
        recipientAddress: address as `0x${string}`,
      },
      {
        onSuccess: (result) => {
          console.log("Withdrawal successful:", result);
          // Show success toast with transaction link
          showToast(
            "success",
            `Successfully withdrew ${parseFloat(amount).toFixed(6)} ${
              selectedToken.symbol
            }! Transaction: ${result.withdrawalTx.slice(0, 10)}...`
          );
          // push back to portfolio page
          router.push("/portfolio");
        },
        onError: (error) => {
          console.error("Withdrawal failed:", error);
          
          // Extract the actual error message
          let errorMessage = "Withdrawal failed. Please try again.";
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as any).message);
          }

          // Show error toast with actual error message
          showToast("error", errorMessage);
        },
      }
    );
  };

  const totalBalance = getTotalBalance();
  const balanceBreakdown = getBalanceBreakdown();
  const ethBridgeWarning = getEthBridgeWarning();

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen h-screen bg-white flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Hidden input for paste functionality */}
        <input
          ref={pasteInputRef}
          type="text"
          className="opacity-0 absolute"
          onPaste={handlePasteInput}
        />

        <div
          className={`flex flex-col flex-1 transition-all duration-200 ${
            isDrawerOpen ? "blur-sm" : ""
          }`}
        >
          {/* Top bar with back icon and title */}
          <div className="flex items-center px-4 pt-4 pb-2 flex-shrink-0">
            <button
              className="mr-2 p-2 rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </button>
            <h1 className="text-lg font-bold ml-2">Withdraw</h1>
          </div>

          {/* Main content */}
          <div className="flex flex-col px-3 gap-4 pt-2">
            {/* Amount Card */}
            <div className="rounded-4xl bg-white border p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <input
                    className={`${fontSize} font-regular outline-none bg-transparent w-full ${
                      Number(amount) > Number(totalBalance)
                        ? "text-red-500"
                        : ""
                    }`}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    placeholder="0"
                    value={formatAmount(amount)}
                    onChange={handleAmountChange}
                    disabled={isWithdrawing}
                  />
                </div>
                <button
                  className="flex items-center border active:scale-95 rounded-full ml-2 transition-all duration-150 py-1 px-2 gap-2"
                  disabled={isWithdrawing}
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                    <Image
                      src={selectedToken.icon}
                      alt={selectedToken.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-regular text-black">
                    {selectedToken.symbol}
                  </span>
                </button>
              </div>

              {/* Balance section */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600 text-base">
                  Available Balance
                </span>
                <div className="flex items-center gap-2">
                  {isLoadingBalances ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-base ${
                          Number(amount) > Number(totalBalance)
                            ? "text-red-500"
                            : "text-gray-600"
                        }`}
                      >
                        {`${totalBalance} ${selectedToken.symbol}`}
                      </span>
                      <button
                        className="border rounded-full px-3 py-1 text-xs font-medium text-gray-700 transition-colors"
                        onClick={handleMax}
                        disabled={isWithdrawing}
                      >
                        Max
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Balance breakdown */}
              {balanceBreakdown.length > 1 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 mb-1 block">
                    Balance by network:
                  </span>
                  {balanceBreakdown.map(({ chain, balance }) => (
                    <div
                      key={chain}
                      className="flex justify-between text-xs text-gray-600"
                    >
                      <span className="capitalize">{chain}:</span>
                      <span>
                        {parseFloat(balance).toFixed(6)} {selectedToken.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* "To" label */}
            <div className="flex items-center justify-center my-1">
              <div className="font-bold text-gray-500">
                <span className="text-xl">To</span>
              </div>
            </div>

            {/* Address Card */}
            <div className="rounded-4xl bg-white border p-4 flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 text-md text-muted-foreground outline-none bg-transparent"
                  type="text"
                  placeholder="Paste or type crypto address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    // Clear error when user modifies address
                    if (errorMessage) setErrorMessage("");
                  }}
                  disabled={isWithdrawing}
                />
              </div>
            </div>

            {/* Network info section - Simplified */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-7">
              <div className="flex items-center gap-3">
                {/* Scroll network icon */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                  <Image
                    src="/scroll.png"
                    alt="Scroll Network"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Withdrawal to Scroll Network
                  </span>
                  <p className="text-gray-600 text-xs">
                    You will receive{" "}
                    <span className="font-medium text-gray-900">
                      {selectedToken.symbol}
                    </span>{" "}
                    on{" "}
                    <span className="font-medium text-gray-900">
                      Scroll Network
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bridge amount warning - show for both existing USDC/USDT logic and new ETH validation */}
            {(() => {
              const isBridgeTooSmall = isBridgeAmountTooSmall();
              const ethWarning = getEthBridgeWarning();

              if (!isBridgeTooSmall && !ethWarning) return null;

              // Determine which warning to show
              let title = "⚠️ Bridge Amount Too Small";
              let message = "";

              if (ethWarning) {
                title = "⚠️ ETH Bridge Amount Warning";
                message =
                  "Some ETH amounts may be too small for cross-chain bridging and causing error. Consider withdrawing a larger total amount.";
              } else if (isBridgeTooSmall) {
                message = `This withdrawal requires bridging ${getAmountToBridgeFromBase().toFixed(
                  6
                )} ${
                  selectedToken.symbol
                } from other chains to Scroll. Bridge amounts under $2 equivalent may fail due to fees being higher than the amount. Consider withdrawing a larger amount for reliable processing.`;
              }

              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="text-yellow-800 font-semibold text-sm mb-1">
                    {title}
                  </div>
                  <div className="text-yellow-700 text-sm">{message}</div>
                </div>
              );
            })()}
          </div>

          {/* Continue button fixed at bottom */}
          <div className="w-full bg-white px-4 pb-4 pt-6">
            <button
              className={`w-full py-3.5 rounded-2xl font-semibold text-lg transition-colors ${
                amount && Number(amount) > 0 && address && !isWithdrawing
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400"
              }`}
              disabled={
                !amount ||
                Number(amount) <= 0 ||
                !address ||
                isWithdrawing ||
                isLoadingBalances
              }
              onClick={handleWithdraw}
            >
              {isWithdrawing ? "Processing Withdrawal..." : "Continue"}
            </button>
          </div>
        </div>

        {/* Token Select Drawer */}
        <TokenSelectDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selectedToken={selectedToken}
          onTokenSelect={handleTokenSelect}
          getTotalBalanceForToken={getTotalBalanceForToken}
        />
      </motion.div>
    </AnimatePresence>
  );
}
