"use client";

import React from "react";
import TabNavigation from "../components/ui/TabNavigation";
import { TaskCard } from "../components/rewards/TaskCard";
import { Button } from "../components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";
import { useRewards, useMultiChainSmartWallet } from "../lib/hooks";
import { PullToRefresh } from "../components/PullToRefresh";
import { Skeleton } from "../components/ui/skeleton";
import { SkeletonCard } from "../components/ui/skeletons";

// Skeleton component for rewards cards
function RewardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {/* Points Card Skeleton */}
      <SkeletonCard showDecorations={true}>
        <div className="flex flex-col items-start gap-2">
          <div className="flex justify-between w-full items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </SkeletonCard>

      {/* Referral Code Card Skeleton */}
      <SkeletonCard>
        <div className="flex justify-between">
          <div className="flex flex-col items-start">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex flex-col items-end">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="w-full flex justify-start mt-2">
          <Skeleton className="h-3 w-32" />
        </div>
      </SkeletonCard>
    </div>
  );
}

// Task Card Skeleton
function TaskCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const smartAccountAddress = multiChainWalletData?.smartAccountAddress;
  const { data: rewardsData, isLoading } = useRewards(
    smartAccountAddress ?? ""
  );

  const [copied, setCopied] = React.useState(false);

  const copyReferralCode = () => {
    if (rewardsData?.referral_code) {
      navigator.clipboard.writeText(rewardsData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && rewardsData?.referral_code) {
      try {
        await navigator.share({
          title: "Join me on Polystream!",
          text: "Use my referral code to sign up:",
          url: `https://app.polystream.xyz/sign-in/?ref=${rewardsData.referral_code}`,
        });
      } catch (error) {
        // User cancelled or sharing failed
        console.error("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      copyReferralCode();
      alert("Sharing is not supported on this device. Referral code copied!");
    }
  };

  // Convert tasks from the API to the format expected by TaskCard
  const tasks = [
    {
      id: "first_deposit",
      title: "First Deposit",
      completed: rewardsData?.tasks.first_deposit.completed || false,
      claimed: false,
      description: "Earn points equal to first deposit amount",
      pointsEarned: Number(rewardsData?.points_breakdown.deposit_points ?? 0),
    },
    {
      id: "accrual_participation",
      title: "Points on Profit",
      completed: rewardsData?.tasks.accrual_participation.completed || false,
      claimed: false,
      description: "Earn points equal to your strategy's profits.",
      pointsEarned: Number(rewardsData?.points_breakdown.accrual_points ?? 0),
    },
    {
      id: "referral_program",
      title: "Referral Program",
      completed: rewardsData?.tasks.referral_program.completed || false,
      claimed: false,
      description: "Earn 100 points per qualified referral",
      pointsEarned: Number(rewardsData?.points_breakdown.referral_points ?? 0),
    },
  ];

  return (
    <>
      <PullToRefresh>
        <main className="flex min-h-screen flex-col bg-background relative">
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold mb-6 text-foreground">
                Rewards
              </h1>
            </div>

            {isLoading ? (
              <RewardsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {/* Points Card */}
                <div className="rewards-card">
                  <div className="rewards-sparkle rewards-sparkle-1"></div>
                  <div className="rewards-sparkle rewards-sparkle-2"></div>
                  <div className="rewards-sparkle rewards-sparkle-3"></div>
                  <div className="rewards-card-content">
                    <div className="flex flex-col items-start gap-2">
                      <h3 className="text-xl font-semibold text-primary w-full items-center flex justify-between">
                        Total Points
                      </h3>
                      <div className="text-5xl font-semibold text-primary">
                        {Number(rewardsData?.total_points || 0) < 0.01
                          ? "0"
                          : Number(rewardsData?.total_points || 0).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Earn points every time you complete these task(s).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Code Card */}
                <div className="rewards-card">
                  <div className="rewards-card-content">
                    <div className="flex justify-between">
                      <div className="flex flex-col items-start">
                        <h3 className="text-sm font-regular text-muted-foreground">
                          Referral code
                        </h3>
                        <div className="flex items-center gap-1">
                          {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                          ) : (
                            <div className="text-2xl font-semibold text-foreground">
                              {rewardsData?.referral_code || "N/A"}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={copyReferralCode}
                            className="h-6 w-6 mt-1"
                            disabled={!rewardsData?.referral_code}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleShare}
                            className="h-6 w-6 mt-1"
                            disabled={!rewardsData?.referral_code}
                            aria-label="Share referral code"
                          >
                            <Share2 className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <h3 className="text-sm font-regular text-muted-foreground">
                          Total Referees
                        </h3>
                        <div className="flex items-center gap-1">
                          <div className="text-2xl font-semibold text-foreground">
                            {rewardsData?.referral_stats.referred_users_count ||
                              0}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Last updated time at the bottom right */}
                    <div className="w-full flex justify-start mt-2">
                      <span className="text-xs text-muted-foreground">
                        Last updated: {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold text-primary">Tasks</h2>
            </div>

            {/* Tabs */}
            <div className="space-y-4 mb-20">
              {isLoading
                ? // Show skeleton task cards while loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <TaskCardSkeleton key={index} />
                  ))
                : tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      description={task.description}
                      imageUrl={`/${task.title
                        .toLowerCase()
                        .replace(/\s+/g, "")}.png`}
                      pointsEarned={task.pointsEarned}
                    />
                  ))}
            </div>
          </div>
        </main>
      </PullToRefresh>
      <TabNavigation activeTab="rewards" />
    </>
  );
}
