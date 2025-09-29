"use client";

import React from "react";
import PredictionDetailPage from "../../components/predictions/PredictionDetailPage";

// Hardcoded data for US Government Shutdown 2025
const usShutdownMarket = {
  id: "us-shutdown-2025",
  title: "US government shutdown in 2025?",
  chance: 72,
  volume: "2,371,214",
  endDate: "Dec 31, 2025",
  icon: "🏛️",
  priceYes: 0.72,
  priceNo: 0.28,
  change: 47,
  chartData: [
    { month: "Feb", probability: 15 },
    { month: "Mar", probability: 45 },
    { month: "Apr", probability: 38 },
    { month: "May", probability: 42 },
    { month: "Jun", probability: 35 },
    { month: "Jul", probability: 40 },
    { month: "Aug", probability: 55 },
    { month: "Sep", probability: 72 },
  ],
  orderBook: {
    bids: [
      { price: 0.71, amount: 1500, total: 1065 },
      { price: 0.70, amount: 2200, total: 1540 },
      { price: 0.69, amount: 1800, total: 1242 },
      { price: 0.68, amount: 2500, total: 1700 },
      { price: 0.67, amount: 1200, total: 804 },
    ],
    asks: [
      { price: 0.73, amount: 1800, total: 1314 },
      { price: 0.74, amount: 2100, total: 1554 },
      { price: 0.75, amount: 1600, total: 1200 },
      { price: 0.76, amount: 1900, total: 1444 },
      { price: 0.77, amount: 1400, total: 1078 },
    ],
  },
  marketContext: "The US government shutdown prediction market reflects growing concerns about budget negotiations and political gridlock in 2025. Key factors include the upcoming presidential election cycle, potential changes in congressional control, and ongoing debates over federal spending priorities. Historical data shows that shutdowns are more likely during election years when political posturing increases.",
  relatedMarkets: [
    {
      id: "us-shutdown-october",
      title: "US government shutdown by October 1?",
      probability: 63,
      icon: "🏛️",
    },
    {
      id: "no-shutdown-2025",
      title: "Will the federal government not be shut down in 2025?",
      probability: 28,
      icon: "🏛️",
    },
    {
      id: "funding-lapse",
      title: "Funding lapse without government shutdown?",
      probability: 11,
      icon: "🏛️",
    },
  ],
};

export default function USShutdown2025Page() {
  return <PredictionDetailPage market={usShutdownMarket} />;
}
