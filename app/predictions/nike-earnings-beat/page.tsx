"use client";

import React from "react";
import PredictionDetailPage from "../../components/predictions/PredictionDetailPage";

// Hardcoded data for NIKE Earnings Beat
const nikeEarningsBeatMarket = {
  id: "nike-earnings-beat",
  title: "Will NIKE (NKE) beat quarterly earnings?",
  chance: 82,
  volume: "41,000",
  endDate: "Dec 20, 2024",
  icon: "👟",
  priceYes: 0.82,
  priceNo: 0.18,
  change: 15,
  chartData: [
    { month: "Feb", probability: 45 },
    { month: "Mar", probability: 52 },
    { month: "Apr", probability: 58 },
    { month: "May", probability: 62 },
    { month: "Jun", probability: 68 },
    { month: "Jul", probability: 72 },
    { month: "Aug", probability: 76 },
    { month: "Sep", probability: 82 },
  ],
  orderBook: {
    bids: [
      { price: 0.81, amount: 800, total: 648 },
      { price: 0.80, amount: 1200, total: 960 },
      { price: 0.79, amount: 900, total: 711 },
      { price: 0.78, amount: 1100, total: 858 },
      { price: 0.77, amount: 700, total: 539 },
    ],
    asks: [
      { price: 0.83, amount: 600, total: 498 },
      { price: 0.84, amount: 800, total: 672 },
      { price: 0.85, amount: 500, total: 425 },
      { price: 0.86, amount: 700, total: 602 },
      { price: 0.87, amount: 400, total: 348 },
    ],
  },
  marketContext: "NIKE's quarterly earnings prediction reflects strong market confidence in the company's performance. Key factors include robust global demand for athletic footwear, successful digital transformation initiatives, and strong brand recognition. The company's recent investments in sustainable products and direct-to-consumer channels are expected to drive revenue growth and margin expansion.",
  relatedMarkets: [
    {
      id: "nike-revenue-beat",
      title: "Will NIKE beat revenue expectations?",
      probability: 78,
      icon: "👟",
    },
    {
      id: "athletic-wear-growth",
      title: "Will athletic wear industry grow this quarter?",
      probability: 89,
      icon: "👟",
    },
    {
      id: "nike-stock-rise",
      title: "Will NIKE stock rise after earnings?",
      probability: 65,
      icon: "👟",
    },
  ],
};

export default function NikeEarningsBeatPage() {
  return <PredictionDetailPage market={nikeEarningsBeatMarket} />;
}
