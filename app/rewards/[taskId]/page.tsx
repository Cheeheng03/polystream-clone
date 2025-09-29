"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { useRewards, useMultiChainSmartWallet } from "@/app/lib/hooks";

export default function TaskDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const { data: multiChainWalletData } = useMultiChainSmartWallet();
  const smartAccountAddress = multiChainWalletData?.smartAccountAddress;
  const { data: rewardsData } = useRewards(smartAccountAddress ?? "");

  // Get task details based on taskId
  const getTaskDetails = () => {
    const taskMap = {
      first_deposit: {
        title: "First Deposit",
        description: "Earn points equal to first deposit amount",
        pointsEarned: rewardsData?.points_breakdown.deposit_points ?? 0,
        howItWorks: [
          "Make your first deposit into any vault, minimum 10 USDC",
          "Points are equal to your deposit amount",
          "Points are automatically credited to your account after 24 hours",
        ],
        termsAndConditions: [
          "Only first-time deposits are eligible",
          "Deposit must be held for at least 24 hours",
          "Points are non-transferable",
          "Management reserves the right to modify terms",
        ],
      },
      accrual_participation: {
        title: "Points on Profit",
        description: "Earn points equal to your strategy's profits",
        pointsEarned: rewardsData?.points_breakdown.accrual_points ?? 0,
        howItWorks: [
          "Deposit into any vault",
          "Earn points based on your strategy's profits",
          "Points are automatically credited daily",
          "No maximum cap on points earned",
        ],
        termsAndConditions: [
          "Must maintain minimum deposit amount",
          "Points are calculated based on actual profits",
          "Points are non-transferable",
          "Management reserves the right to modify terms",
        ],
      },
      referral_program: {
        title: "Referral Program",
        description: "Earn 100 points per qualified referral",
        pointsEarned: rewardsData?.points_breakdown.referral_points ?? 0,
        howItWorks: [
          "Share your unique referral code",
          "Get 100 points for each qualified referral",
          "Referrals must complete first deposit",
          "No limit on number of referrals",
        ],
        termsAndConditions: [
          "Referrals must be new users",
          "Referrals must complete first deposit",
          "Points are non-transferable",
          "Management reserves the right to modify terms",
        ],
      },
    };

    return (
      taskMap[taskId as keyof typeof taskMap] || {
        title: "Unknown Task",
        description: "Task details not found",
        pointsEarned: 0,
        howItWorks: [],
        termsAndConditions: [],
      }
    );
  };

  const taskDetails = getTaskDetails();

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex items-center h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Task Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {/* Task Image */}
        <div className="w-full h-48 relative">
          <Image
            src={`/${taskDetails.title.toLowerCase().replace(/\s+/g, "")}.png`}
            alt={taskDetails.title}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Task Info */}
        <div className="p-6 space-y-6">
          {/* Title and Points */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              {taskDetails.title}
            </h2>
            <p className="text-muted-foreground">{taskDetails.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Points earned:
              </span>
              <span className="text-lg font-semibold text-primary">
                {Number(taskDetails.pointsEarned) < 0.01
                  ? "0"
                  : Number(taskDetails.pointsEarned).toFixed(2)}
              </span>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-foreground">
              How does it work?
            </h3>
            <ul className="space-y-3">
              {taskDetails.howItWorks.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms and Conditions Section */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-foreground">
              Terms & Conditions
            </h3>
            <ul className="space-y-3">
              {taskDetails.termsAndConditions.map((term, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
