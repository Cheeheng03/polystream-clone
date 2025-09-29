"use client";

import React from "react";
import TradingPageLayout from "../components/trading/TradingPageLayout";

// Hardcoded SCR trading data
const scrAsset = {
  id: "scr",
  symbol: "SCR",
  name: "Scroll",
  price: 0.2866,
  change: 2.87,
  changePercent: 2.87,
  high24h: 0.2920,
  low24h: 0.2750,
  volume24h: "109.7K",
  icon: "S",
  iconBg: "bg-amber-200",
};

// Hardcoded candlestick data for SCR
const scrCandlestickData = [
  { time: "09:00", open: 0.278, high: 0.282, low: 0.275, close: 0.280, volume: 25000 },
  { time: "10:00", open: 0.280, high: 0.285, low: 0.278, close: 0.283, volume: 26400 },
  { time: "11:00", open: 0.283, high: 0.288, low: 0.281, close: 0.286, volume: 29600 },
  { time: "12:00", open: 0.286, high: 0.292, low: 0.284, close: 0.289, volume: 31200 },
  { time: "13:00", open: 0.289, high: 0.291, low: 0.286, close: 0.288, volume: 28400 },
  { time: "14:00", open: 0.288, high: 0.290, low: 0.285, close: 0.287, volume: 27600 },
  { time: "15:00", open: 0.287, high: 0.289, low: 0.284, close: 0.286, volume: 29000 },
  { time: "16:00", open: 0.286, high: 0.288, low: 0.285, close: 0.2866, volume: 28200 },
];

// Hardcoded order book data for SCR
const scrOrderBookData = {
  bids: [
    { price: 0.2865, amount: 15000, total: 4297.5 },
    { price: 0.2864, amount: 22000, total: 6300.8 },
    { price: 0.2863, amount: 18000, total: 5153.4 },
    { price: 0.2862, amount: 32000, total: 9158.4 },
    { price: 0.2861, amount: 25000, total: 7152.5 },
  ],
  asks: [
    { price: 0.2867, amount: 12000, total: 3440.4 },
    { price: 0.2868, amount: 19000, total: 5449.2 },
    { price: 0.2869, amount: 16000, total: 4590.4 },
    { price: 0.2870, amount: 28000, total: 8036 },
    { price: 0.2871, amount: 21000, total: 6029.1 },
  ],
};

export default function SCRTradePage() {
  return (
    <TradingPageLayout
      asset={scrAsset}
      candlestickData={scrCandlestickData}
      orderBookData={scrOrderBookData}
    />
  );
}
