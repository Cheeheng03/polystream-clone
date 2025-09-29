"use client";

import React, { useState } from "react";
import { ProfileHeader } from "../components/ui/profile-header";
import TabNavigation from "../components/ui/TabNavigation";
import { PullToRefresh } from "../components/PullToRefresh";
import PredictionCard from "../components/predictions/PredictionCard";

// Hardcoded prediction market data
const predictionMarkets = [
  {
    id: "us-shutdown-2025",
    title: "US government shutdown in 2025?",
    chance: 72,
    type: "binary" as const,
    volume: "2m",
    icon: "🏛️",
    outcomes: [
      { name: "Yes", probability: 72, color: "green" as const },
      { name: "No", probability: 28, color: "red" as const }
    ]
  },
  {
    id: "bad-bunny-superbowl",
    title: "Will Bad Bunny perform at Super Bowl halftime show?",
    chance: 98,
    type: "binary" as const,
    volume: "186k",
    icon: "🏈",
    outcomes: [
      { name: "Yes", probability: 98, color: "green" as const },
      { name: "No", probability: 2, color: "red" as const }
    ]
  },
  {
    id: "nyc-mayor-mamdani",
    title: "Will Zohran Mamdani win NYC Mayoral Election?",
    chance: 85,
    type: "binary" as const,
    volume: "107m",
    icon: "🗽",
    outcomes: [
      { name: "Yes", probability: 85, color: "green" as const },
      { name: "No", probability: 15, color: "red" as const }
    ]
  },
  {
    id: "eric-adams-endorse-cuomo",
    title: "Will Eric Adams endorse Cuomo?",
    chance: 51,
    type: "binary" as const,
    volume: "293k",
    icon: "👤",
    outcomes: [
      { name: "Yes", probability: 51, color: "green" as const },
      { name: "No", probability: 49, color: "red" as const }
    ]
  },
  {
    id: "nike-earnings-beat",
    title: "Will NIKE (NKE) beat quarterly earnings?",
    chance: 82,
    type: "binary" as const,
    volume: "41k",
    icon: "👟",
    outcomes: [
      { name: "Yes", probability: 82, color: "green" as const },
      { name: "No", probability: 18, color: "red" as const }
    ]
  }
];

export default function PredictionsPage() {
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <ProfileHeader
        showName={true}
        onSheetOpenChange={setIsProfileSheetOpen}
      />

      <PullToRefresh refreshType="trade">
        <div
          className={`flex-1 px-4 pb-32 transition-all duration-200 ${
            isProfileSheetOpen ? "blur-sm" : ""
          }`}
        >
          {/* Header */}
          <div className="py-4">
            <h1 className="text-2xl font-bold text-foreground">Prediction Markets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bet on the future with prediction markets
            </p>
          </div>

          {/* Prediction Markets Grid */}
          <div className="grid grid-cols-1 gap-4">
            {predictionMarkets.map((market) => (
              <PredictionCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      </PullToRefresh>

      <TabNavigation activeTab="news-market" />
    </main>
  );
}
