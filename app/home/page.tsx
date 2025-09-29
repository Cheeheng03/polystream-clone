"use client";

import React, { useState } from "react";
import TabNavigation from "../components/ui/TabNavigation";
import {
  TrendingUp,
  ChevronRight,
  History,
  Sparkles,
  BookOpen,
  HelpCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { ProfileHeader } from "../components/ui/profile-header";
import { AICard } from "../components/ui/ai-card";
import { PullToRefresh } from "../components/PullToRefresh";
import { Button } from "../components/ui/button";
import TopAssets from "../components/portfolio/TopAssets";
import {
  useTotalAssets,
  useTransactionsOptimized,
  useMultiChainSmartWallet,
} from "../lib/hooks";
import {
  BalanceSkeleton,
  TransactionsSkeleton,
  LearnCardSkeleton,
} from "../components/ui/skeletons";
import { useRouter } from "next/navigation";

export default function Home() {
  const {
    totalAssets,
    walletBalance,
    isLoading: assetsLoading,
  } = useTotalAssets();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const walletAddress = multiChainWalletData?.smartAccountAddress;
  const { data: transactions, isLoading: transactionsLoading } =
    useTransactionsOptimized(1, 20);
  const router = useRouter();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const learnCards = [
    {
      icon: Sparkles,
      title: "How Polystream Works",
      description:
        "Discover the simple steps to start earning yields on your crypto assets with our intuitive platform.",
      href: "/learn/how-it-works",
      cta: "Get Started",
    },
    {
      icon: BookOpen,
      title: "Understanding DeFi",
      description:
        "New to Decentralized Finance? We break down the basics and key concepts for you.",
      href: "/learn/what-is-defi",
      cta: "Explore DeFi",
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description:
        "Find answers to common questions or get in touch with our dedicated support team.",
      href: "/support",
      cta: "Get Support",
    },
  ];

  // Enhanced icon mapping for transaction types including swap
  const getTransactionIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      deposit: <span className="text-black">+</span>,
      withdraw: <span className="text-black">-</span>,
      accrue: <span className="text-green-500">+</span>,
      "transfer-in": (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 5L15 15"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 8V15H8"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      "transfer-out": (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 15L15 5"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 5H15V8"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      swap: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };

    return iconMap[type] || null;
  };

  // Enhanced color mapping for transaction types
  const getTransactionColors = (type: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      deposit: { bg: "bg-gray-100", text: "text-black" },
      withdraw: { bg: "bg-gray-100", text: "text-black" },
      accrue: { bg: "bg-green-100", text: "text-green-500" },
      "transfer-in": { bg: "bg-green-100", text: "text-green-500" },
      "transfer-out": { bg: "bg-gray-100", text: "text-black" },
      swap: { bg: "bg-gray-100", text: "text-black" },
    };

    return colorMap[type] || { bg: "bg-gray-100", text: "text-black" };
  };

  // Enhanced transaction label formatting
  const getTransactionLabel = (tx: any) => {
    if (tx.type === "swap") {
      return "Swap";
    }

    switch (tx.type) {
      case "accrue":
        return "Yield Earned";
      case "transfer-in":
        return "Received";
      case "transfer-out":
        return "Sent";
      default:
        return tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
    }
  };

  // Enhanced amount formatting for different transaction types
  const formatTransactionAmount = (tx: any) => {
    if (tx.type === "swap") {
      // For swaps, show the output amount (what they received)
      return `${tx.amount.toFixed(tx.token === "ETH" ? 6 : 2)} ${tx.token}`;
    }

    let sign = "";
    if (tx.type === "transfer-in" || tx.type === "accrue") sign = "+";
    if (tx.type === "transfer-out") sign = "-";

    return `${sign}${tx.amount.toFixed(tx.token === "ETH" ? 6 : 2)} ${
      tx.token
    }`;
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sticky Header */}
      <ProfileHeader
        showName={true}
        onSheetOpenChange={setIsProfileSheetOpen}
      />

      <PullToRefresh refreshType="home">
        {/* Main Content Area */}
        <div
          className={`flex-1 px-6 pb-6 space-y-10 transition-all duration-200 ${
            isProfileSheetOpen ? "blur-sm" : ""
          }`}
        >
          {/* Balance Section */}
          <div className="mt-4 mb-6 overflow-hidden">
            {assetsLoading ? (
              <BalanceSkeleton />
            ) : (
              <div className="p-6 rounded-3xl relative overflow-hidden bg-primary">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 translate-x-[30%] -translate-y-[30%]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 -translate-x-[30%] translate-y-[30%]"></div>
                <Link href="/portfolio" className="block relative z-10">
                  <h1 className="text-sm font-medium mb-2 text-white/90">
                    Total balance
                  </h1>
                  <p className="text-3xl font-bold mb-4 text-white">
                    USD{" "}
                    {totalAssets.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </Link>
                <div className="flex justify-between items-center relative z-10">
                  <Button
                    onClick={() => router.push("/buy")}
                    className="text-lg font-regular bg-white/30 px-3 py-1 rounded-full text-white flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Deposit
                  </Button>
                  <Link
                    href="/portfolio"
                    className="text-sm font-medium flex items-center text-white hover:text-white/80 transition-colors"
                  >
                    View details
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Get Started CTA - Only shows when totalAssets is 0 */}
          {!assetsLoading && Number(totalAssets) === 0 && (
            <Link
              href="/buy"
              className="block group animate-fade-in animation-delay-100"
            >
              <AICard>
                <div className="p-5 bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-accent p-3 rounded-full">
                        <TrendingUp className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground group-hover:text-accent-foreground transition-colors">
                          Start growing your assets
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Make your first deposit and earn yields.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-muted/50 group-hover:bg-accent text-accent-foreground transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </AICard>
            </Link>
          )}

          {/* Invest CTA - Shows when user has wallet balance */}
          {!assetsLoading && Number(totalAssets) > 0 && (
            <Link
              href="/market"
              className="block group animate-fade-in animation-delay-100"
            >
              <AICard>
                <div className="p-5 bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-accent p-3 rounded-full">
                        <Sparkles className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground group-hover:text-accent-foreground transition-colors">
                          Start Earning Yields
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Invest your balance in yield strategies.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-muted/50 group-hover:bg-accent text-accent-foreground transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </AICard>
            </Link>
          )}

          {/* Today's Yield Summary - Always show */}
          {!transactionsLoading &&
            (() => {
              const today = new Date().toDateString();
              const accrueTransactions =
                transactions?.filter((tx) => tx.type === "accrue") || [];
              const todayAccrued = accrueTransactions
                .filter(
                  (tx) => new Date(tx.timestamp * 1000).toDateString() === today
                )
                .reduce((sum, tx) => sum + tx.amount, 0);

              return (
                <section className="animate-fade-in animation-delay-150">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Today&apos;s Earnings
                    </h2>
                    <Link
                      href="/yield"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center group"
                    >
                      View All
                      <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                  <Link href="/yield" className="block group">
                    <div className="earnings-card card-tap-effect">
                      <div className="earnings-sparkle earnings-sparkle-1"></div>
                      <div className="earnings-sparkle earnings-sparkle-2"></div>
                      <div className="earnings-sparkle earnings-sparkle-3"></div>
                      <div className="earnings-card-content">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                              <span className="text-green-500">$</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">
                                Total Yield Earned
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Today • Tap to view all
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-500">
                              +{todayAccrued.toFixed(2)} USDC
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </section>
              );
            })()}

          {/* Top Assets Section */}
          <TopAssets />

          {/* Recent Activity Teaser */}
          <section className="animate-fade-in animation-delay-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>
              <Link
                href="/transactions"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center group"
              >
                View All
                <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Loading state */}
            {transactionsLoading && <TransactionsSkeleton count={3} />}

            {/* Placeholder for no transactions */}
            {!transactionsLoading &&
              (!transactions || transactions.length === 0) && (
                <div className="text-center bg-card border border-border rounded-xl p-8">
                  <History
                    className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3"
                    strokeWidth={1.5}
                  />
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    No Transactions Yet
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your recent transactions will appear here.
                  </p>
                  {!assetsLoading && totalAssets > 0 && (
                    <button className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-xs hover:bg-primary/90 transition-colors">
                      Make a Deposit
                    </button>
                  )}
                </div>
              )}

            {/* Show transactions if they exist */}
            {!transactionsLoading &&
              transactions &&
              transactions.length > 0 && (
                <div className="space-y-2">
                  {(() => {
                    const recentTransactions = transactions.slice(0, 3);

                    return recentTransactions.map((tx) => {
                      const label = getTransactionLabel(tx);
                      const colors = getTransactionColors(tx.type);
                      const icon = getTransactionIcon(tx.type);

                      return (
                        <Link
                          key={tx.id}
                          href={`/transaction/${tx.hash}`}
                          className="block group"
                        >
                          <div className="activity-card card-tap-effect">
                            <div className="activity-card-content">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}
                                  >
                                    {icon}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground">
                                      {label}
                                    </h4>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <span>
                                        {new Date(
                                          tx.timestamp * 1000
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-sm font-medium ${colors.text}`}
                                  >
                                    {formatTransactionAmount(tx)}
                                  </p>
                                  {tx.type === "swap" && (
                                    <p className="text-xs text-muted-foreground">
                                      Swap
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    });
                  })()}
                </div>
              )}
          </section>

          {/* Learn & Discover Section */}
          <section className="animate-fade-in animation-delay-300 mb-16">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Learn & Discover
            </h2>
            {assetsLoading ? (
              <LearnCardSkeleton count={learnCards.length} />
            ) : (
              <div className="flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-hide">
                {learnCards.map((card, index) => (
                  <Link
                    href={card.href}
                    key={index}
                    className="flex-shrink-0 w-[280px] sm:w-[300px] bg-card border border-border rounded-xl p-5 flex flex-col"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-primary mb-1.5">
                      {card.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow mb-4">
                      {card.description}
                    </p>
                    <div className="inline-flex items-center text-xs font-medium text-muted-foreground self-start">
                      {card.cta}
                      <ChevronRight className="ml-1 w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>

      <TabNavigation activeTab="home" />
    </main>
  );
}
