"use client";

import React from "react";
import TradingPageLayout from "../components/trading/TradingPageLayout";

// Hardcoded ETH trading data
const ethAsset = {
  id: "eth",
  symbol: "ETH",
  name: "Ethereum",
  price: 4111.95,
  change: 2.70,
  changePercent: 2.70,
  high24h: 4200.00,
  low24h: 3980.00,
  volume24h: "662.47M",
  icon: "⟠",
  iconBg: "bg-blue-500",
};

// Hardcoded candlestick data for ETH
const ethCandlestickData = [
  { time: "09:00", open: 4000, high: 4050, low: 3980, close: 4030, volume: 1850 },
  { time: "10:00", open: 4030, high: 4080, low: 4020, close: 4060, volume: 1920 },
  { time: "11:00", open: 4060, high: 4100, low: 4040, close: 4080, volume: 2100 },
  { time: "12:00", open: 4080, high: 4120, low: 4060, close: 4100, volume: 2250 },
  { time: "13:00", open: 4100, high: 4150, low: 4080, close: 4120, volume: 1980 },
  { time: "14:00", open: 4120, high: 4140, low: 4090, close: 4105, volume: 1850 },
  { time: "15:00", open: 4105, high: 4130, low: 4090, close: 4110, volume: 2020 },
  { time: "16:00", open: 4110, high: 4120, low: 4095, close: 4111.95, volume: 1880 },
];

// Hardcoded order book data for ETH
const ethOrderBookData = {
  bids: [
    { price: 4110, amount: 2.5, total: 10275 },
    { price: 4105, amount: 3.2, total: 13136 },
    { price: 4100, amount: 1.8, total: 7380 },
    { price: 4095, amount: 4.1, total: 16789.5 },
    { price: 4090, amount: 2.7, total: 11043 },
  ],
  asks: [
    { price: 4115, amount: 1.9, total: 7818.5 },
    { price: 4120, amount: 2.8, total: 11536 },
    { price: 4125, amount: 2.1, total: 8662.5 },
    { price: 4130, amount: 3.5, total: 14455 },
    { price: 4135, amount: 2.4, total: 9924 },
  ],
};

export default function ETHTradePage() {
  return (
    <TradingPageLayout
      asset={ethAsset}
      candlestickData={ethCandlestickData}
      orderBookData={ethOrderBookData}
    />
  );
}
