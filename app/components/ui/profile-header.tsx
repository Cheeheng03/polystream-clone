"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import {
  History,
  Copy,
  Check,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Wallet,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "./sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  useDeploySmartAccount,
  useClearWalletCache,
  formatAddress,
  useUserData,
  useMultiChainSmartWallet,
  useDefaultDisplayName,
  useAdditionalUserInfo,
} from "@/app/lib/hooks";
import { FiX } from "react-icons/fi";

interface ProfileHeaderProps {
  showName?: boolean;
  userName?: string;
  userEmail?: string;
  avatarFallback?: string;
  className?: string;
  onSheetOpenChange?: (open: boolean) => void;
}

export function ProfileHeader({
  showName = false,
  className,
  onSheetOpenChange,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { logout, authenticated, user: privyUser } = usePrivy();

  // Get real user data
  const { data: userData, isLoading: userLoading } = useUserData();

  // Add logout state to prevent smart wallet hook from running during logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Only call useMultiChainSmartWallet if not logging out
  const {
    data: walletSummary,
    isLoading: walletLoading,
    error,
  } = useMultiChainSmartWallet(isLoggingOut);
  const deployMutation = useDeploySmartAccount();
  const clearWalletCache = useClearWalletCache();

  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Use the new hooks instead of manual logic
  const defaultDisplayName = useDefaultDisplayName();
  const additionalInfo = useAdditionalUserInfo();

  // Show loading states instead of fallback values
  const isUserDataLoading = userLoading || !userData;
  // Only show loading if wallet is loading OR user is loading, but not when deployment is complete
  const isWalletDeploying =
    deployMutation.isPending ||
    (walletSummary && !walletSummary.isFullyDeployed && !walletLoading);
  const userName = isUserDataLoading ? null : userData.name;
  const displayAdditionalInfo = isUserDataLoading ? null : additionalInfo;
  const avatarFallback =
    isUserDataLoading && userName
      ? "..."
      : userName
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();

  const [hasTriggeredDeploy, setHasTriggeredDeploy] = useState(false);

  // Notify parent component when sheet state changes
  useEffect(() => {
    onSheetOpenChange?.(open);
  }, [open, onSheetOpenChange]);

  useEffect(() => {
    if (
      !isLoggingOut &&
      walletSummary &&
      !walletSummary.isFullyDeployed &&
      !deployMutation.isPending &&
      !hasTriggeredDeploy
    ) {
      console.log(
        `Deploying to remaining chains: ${walletSummary.totalChainsDeployed}/${
          Object.keys(walletSummary.chains).length
        } deployed`
      );
      deployMutation.mutate();
      setHasTriggeredDeploy(true);
    }
  }, [isLoggingOut, walletSummary, hasTriggeredDeploy]);

  // Reset when wallet changes
  useEffect(() => {
    if (walletSummary?.isFullyDeployed) {
      setHasTriggeredDeploy(false);
    }
  }, [walletSummary?.isFullyDeployed]);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign out failed", error);
      setIsLoggingOut(false);
    }
  };

  // Clear cache AFTER logout in useEffect
  useEffect(() => {
    if (!authenticated && isLoggingOut) {
      clearWalletCache();
      setIsLoggingOut(false);
    }
  }, [authenticated, isLoggingOut, clearWalletCache]);

  const handleCopyAddress = async () => {
    if (!walletSummary?.smartAccountAddress) return;

    try {
      await navigator.clipboard.writeText(walletSummary.smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  return (
    <div
      className={`px-4 py-2 flex items-center justify-between top-0 bg-background ${
        className || ""
      }`}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div className="cursor-pointer flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/5 text-primary">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            {showName && (
              <div>
                {isUserDataLoading ? (
                  <>
                    <div className="h-5 bg-muted animate-pulse rounded w-24 mb-1"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  </>
                ) : (
                  <div>
                    <span className="text-base font-medium text-foreground block">
                      {userName}
                    </span>
                    {/* Smart Account Address with Copy */}
                    {walletSummary?.smartAccountAddress && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          {/* Show truncated address */}
                          {formatAddress(walletSummary.smartAccountAddress)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress();
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[80%] max-w-[320px] p-0 flex flex-col bg-background z-[999]"
          onInteractOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <SheetHeader className="flex flex-row items-center justify-start px-4 py-3">
            <SheetClose className="text-muted-foreground rounded-full p-1.5 hover:bg-muted transition-colors">
              <FiX className="h-6 w-6" />
            </SheetClose>
            <SheetTitle className="sr-only">Profile Menu</SheetTitle>
          </SheetHeader>

          <div className="flex-1 px-4 overflow-y-auto">
            {/* Profile Card */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-14 w-14 border-2 border-primary/10">
                <AvatarFallback
                  className={`bg-primary/5 text-primary font-medium ${
                    isUserDataLoading ? "animate-pulse" : ""
                  }`}
                >
                  {isUserDataLoading ? (
                    <div className="w-full h-full bg-muted rounded-full"></div>
                  ) : (
                    avatarFallback
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                {isUserDataLoading ? (
                  <>
                    <div className="h-5 bg-muted animate-pulse rounded w-24 mb-1"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-foreground text-lg">
                      {userName}
                    </h3>
                    {displayAdditionalInfo && (
                      <div className="flex items-center gap-2">
                        {displayAdditionalInfo.includes("@") ? (
                          <p className="text-sm text-muted-foreground">
                            {displayAdditionalInfo}
                          </p>
                        ) : (
                          privyUser?.wallet?.address && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              <img
                                src={`/wallet/${displayAdditionalInfo}.png`}
                                alt={displayAdditionalInfo}
                                className="h-3.5 w-3.5 rounded-full"
                                onError={(e) => {
                                  // Fallback to generic wallet icon if specific one not found
                                  e.currentTarget.src = "/wallet/wallet.png";
                                }}
                              />
                              {`${privyUser.wallet.address.slice(
                                0,
                                7
                              )}...${privyUser.wallet.address.slice(-5)}`}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Wallet Card - Only show loading if wallet is initially loading, not during deployment */}
            {walletLoading ? (
              <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
            ) : (
              <div className="bg-card rounded-xl p-4">
                <div className="flex items-center justify-start mb-3 gap-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Your Smart Wallet
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Deployment Status */}
                    {deployMutation.isPending ||
                    (walletSummary && !walletSummary.isFullyDeployed) ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-yellow-700 font-medium">
                          {deployMutation.isPending
                            ? "Deploying..."
                            : "Setting up..."}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          walletSummary?.isFullyDeployed
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {walletSummary?.isFullyDeployed
                          ? "Deployed"
                          : "Not Deployed"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all">
                    {formatAddress(walletSummary?.smartAccountAddress || null)}
                  </p>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress();
                          }}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{copied ? "Copied!" : "Copy address"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center">
                  <Wallet className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-red-700">
                    Wallet error: {error.message}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  router.push("/settings");
                  setOpen(false); // Close the sidebar
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => router.push("/support")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
              >
                <HelpCircle className="h-5 w-5" />
                <span>Support</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-lg transition-colors text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <button
        className={`p-2 border rounded-full text-muted-foreground transition-all duration-200 ${
          open ? "blur-sm" : ""
        }`}
        onClick={() => router.push("/transactions")}
      >
        <History className="h-6 w-6" />
      </button>
    </div>
  );
}
