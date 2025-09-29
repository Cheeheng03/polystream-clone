"use client";

import React from "react";
import PredictionDetailPage from "../../components/predictions/PredictionDetailPage";

// Hardcoded data for Eric Adams Endorse Cuomo
const ericAdamsEndorseCuomoMarket = {
  id: "eric-adams-endorse-cuomo",
  title: "Will Eric Adams endorse Cuomo?",
  chance: 51,
  volume: "293,000",
  endDate: "Oct 15, 2025",
  icon: "👤",
  priceYes: 0.51,
  priceNo: 0.49,
  change: -8,
  chartData: [
    { month: "Feb", probability: 65 },
    { month: "Mar", probability: 62 },
    { month: "Apr", probability: 58 },
    { month: "May", probability: 55 },
    { month: "Jun", probability: 52 },
    { month: "Jul", probability: 50 },
    { month: "Aug", probability: 49 },
    { month: "Sep", probability: 51 },
  ],
  orderBook: {
    bids: [
      { price: 0.50, amount: 1200, total: 600 },
      { price: 0.49, amount: 1800, total: 882 },
      { price: 0.48, amount: 1500, total: 720 },
      { price: 0.47, amount: 2000, total: 940 },
      { price: 0.46, amount: 1000, total: 460 },
    ],
    asks: [
      { price: 0.52, amount: 1100, total: 572 },
      { price: 0.53, amount: 1400, total: 742 },
      { price: 0.54, amount: 1300, total: 702 },
      { price: 0.55, amount: 1600, total: 880 },
      { price: 0.56, amount: 1200, total: 672 },
    ],
  },
  marketContext: "Eric Adams' potential endorsement of Andrew Cuomo remains uncertain due to complex political dynamics. While both are Democrats, their relationship has been strained by Cuomo's previous controversies and Adams' focus on public safety issues. The endorsement decision will likely depend on Cuomo's ability to rehabilitate his image and Adams' political calculations for future elections.",
  relatedMarkets: [
    {
      id: "cuomo-political-comeback",
      title: "Will Andrew Cuomo make a political comeback?",
      probability: 35,
      icon: "👤",
    },
    {
      id: "adams-cuomo-relationship",
      title: "Will Adams and Cuomo reconcile publicly?",
      probability: 42,
      icon: "👤",
    },
    {
      id: "cuomo-endorsement-anyone",
      title: "Will Cuomo receive any major endorsements?",
      probability: 28,
      icon: "👤",
    },
  ],
};

export default function EricAdamsEndorseCuomoPage() {
  return <PredictionDetailPage market={ericAdamsEndorseCuomoMarket} />;
}
