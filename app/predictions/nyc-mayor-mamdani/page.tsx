"use client";

import React from "react";
import PredictionDetailPage from "../../components/predictions/PredictionDetailPage";

// Hardcoded data for NYC Mayoral Election - Zohran Mamdani
const nycMayorMamdaniMarket = {
  id: "nyc-mayor-mamdani",
  title: "Will Zohran Mamdani win NYC Mayoral Election?",
  chance: 85,
  volume: "107,000,000",
  endDate: "Nov 4, 2025",
  icon: "🗽",
  priceYes: 0.85,
  priceNo: 0.15,
  change: 23,
  chartData: [
    { month: "Feb", probability: 45 },
    { month: "Mar", probability: 52 },
    { month: "Apr", probability: 58 },
    { month: "May", probability: 62 },
    { month: "Jun", probability: 68 },
    { month: "Jul", probability: 72 },
    { month: "Aug", probability: 78 },
    { month: "Sep", probability: 85 },
  ],
  orderBook: {
    bids: [
      { price: 0.84, amount: 2500, total: 2100 },
      { price: 0.83, amount: 3200, total: 2656 },
      { price: 0.82, amount: 2800, total: 2296 },
      { price: 0.81, amount: 3500, total: 2835 },
      { price: 0.80, amount: 2000, total: 1600 },
    ],
    asks: [
      { price: 0.86, amount: 1800, total: 1548 },
      { price: 0.87, amount: 2200, total: 1914 },
      { price: 0.88, amount: 1600, total: 1408 },
      { price: 0.89, amount: 1900, total: 1691 },
      { price: 0.90, amount: 1400, total: 1260 },
    ],
  },
  marketContext: "Zohran Mamdani's mayoral campaign has gained significant momentum in New York City politics. As a progressive candidate with strong grassroots support and innovative policy proposals, Mamdani has been leading in recent polls. His platform focuses on affordable housing, climate action, and social justice reforms that resonate with NYC's diverse electorate.",
  relatedMarkets: [
    {
      id: "cuomo-nyc-mayor",
      title: "Will Andrew Cuomo run for NYC Mayor?",
      probability: 14,
      icon: "🗽",
    },
    {
      id: "progressive-nyc-mayor",
      title: "Will a progressive candidate win NYC Mayor?",
      probability: 78,
      icon: "🗽",
    },
    {
      id: "nyc-mayor-democrat",
      title: "Will a Democrat win NYC Mayoral Election?",
      probability: 92,
      icon: "🗽",
    },
  ],
};

export default function NYCMayorMamdaniPage() {
  return <PredictionDetailPage market={nycMayorMamdaniMarket} />;
}
