"use client";

import React from "react";
import PredictionDetailPage from "../../components/predictions/PredictionDetailPage";

// Hardcoded data for Bad Bunny Super Bowl Performance
const badBunnySuperBowlMarket = {
  id: "bad-bunny-superbowl",
  title: "Will Bad Bunny perform at Super Bowl halftime show?",
  chance: 98,
  volume: "186,000",
  endDate: "Feb 9, 2025",
  icon: "🏈",
  priceYes: 0.98,
  priceNo: 0.02,
  change: 12,
  chartData: [
    { month: "Feb", probability: 85 },
    { month: "Mar", probability: 88 },
    { month: "Apr", probability: 92 },
    { month: "May", probability: 90 },
    { month: "Jun", probability: 94 },
    { month: "Jul", probability: 96 },
    { month: "Aug", probability: 95 },
    { month: "Sep", probability: 98 },
  ],
  orderBook: {
    bids: [
      { price: 0.97, amount: 800, total: 776 },
      { price: 0.96, amount: 1200, total: 1152 },
      { price: 0.95, amount: 900, total: 855 },
      { price: 0.94, amount: 1100, total: 1034 },
      { price: 0.93, amount: 700, total: 651 },
    ],
    asks: [
      { price: 0.99, amount: 600, total: 594 },
      { price: 1.00, amount: 500, total: 500 },
      { price: 1.01, amount: 400, total: 404 },
      { price: 1.02, amount: 300, total: 306 },
      { price: 1.03, amount: 200, total: 206 },
    ],
  },
  marketContext: "Bad Bunny's potential Super Bowl halftime performance has generated significant buzz in the entertainment industry. The Puerto Rican reggaeton artist has become one of the most popular Latin music performers globally, with multiple Grammy wins and record-breaking streaming numbers. NFL's recent trend toward diverse, international performers makes this prediction highly likely.",
  relatedMarkets: [
    {
      id: "cardi-b-superbowl",
      title: "Will Cardi B perform at Super Bowl halftime show?",
      probability: 49,
      icon: "🏈",
    },
    {
      id: "latin-artist-superbowl",
      title: "Will a Latin artist perform at Super Bowl halftime?",
      probability: 85,
      icon: "🏈",
    },
    {
      id: "reggaeton-superbowl",
      title: "Will reggaeton music be featured at Super Bowl halftime?",
      probability: 72,
      icon: "🏈",
    },
  ],
};

export default function BadBunnySuperBowlPage() {
  return <PredictionDetailPage market={badBunnySuperBowlMarket} />;
}
