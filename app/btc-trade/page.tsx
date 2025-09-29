"use client";

import React from "react";
import TradingPageLayout from "../components/trading/TradingPageLayout";

// Hardcoded BTC trading data
const btcAsset = {
  id: "btc",
  symbol: "BTC",
  name: "Bitcoin",
  price: 111762.17,
  change: 2.10,
  changePercent: 2.10,
  high24h: 112500.00,
  low24h: 109800.00,
  volume24h: "543.07M",
  icon: "₿",
  iconBg: "bg-orange-500",
};

// Hardcoded candlestick data for BTC
const btcCandlestickData = [
  { time: "09:00", open: 110500, high: 111200, low: 110100, close: 111000, volume: 1250 },
  { time: "10:00", open: 111000, high: 111800, low: 110800, close: 111500, volume: 1180 },
  { time: "11:00", open: 111500, high: 112000, low: 111200, close: 111800, volume: 1350 },
  { time: "12:00", open: 111800, high: 112300, low: 111500, close: 112000, volume: 1420 },
  { time: "13:00", open: 112000, high: 112500, low: 111600, close: 111900, volume: 1280 },
  { time: "14:00", open: 111900, high: 112200, low: 111400, close: 111700, volume: 1150 },
  { time: "15:00", open: 111700, high: 112000, low: 111300, close: 111800, volume: 1320 },
  { time: "16:00", open: 111800, high: 112100, low: 111500, close: 111762, volume: 1200 },
];

// Hardcoded order book data for BTC
const btcOrderBookData = {
  bids: [
    { price: 111750, amount: 0.5, total: 55875 },
    { price: 111740, amount: 1.2, total: 134088 },
    { price: 111730, amount: 0.8, total: 89440 },
    { price: 111720, amount: 2.1, total: 234612 },
    { price: 111710, amount: 1.5, total: 167565 },
  ],
  asks: [
    { price: 111760, amount: 0.7, total: 78232 },
    { price: 111770, amount: 1.1, total: 122947 },
    { price: 111780, amount: 0.9, total: 100602 },
    { price: 111790, amount: 1.8, total: 201222 },
    { price: 111800, amount: 1.3, total: 145340 },
  ],
};

export default function BTCTradePage() {
  return (
    <TradingPageLayout
      asset={btcAsset}
      candlestickData={btcCandlestickData}
      orderBookData={btcOrderBookData}
    />
  );
}
