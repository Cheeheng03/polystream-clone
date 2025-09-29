"use client";

import React from "react";
import TradingPageLayout from "../components/trading/TradingPageLayout";

// Hardcoded XRP trading data
const xrpAsset = {
  id: "xrp",
  symbol: "XRP",
  name: "XRP",
  price: 2.8635,
  change: 2.86,
  changePercent: 2.86,
  high24h: 2.9200,
  low24h: 2.7500,
  volume24h: "75.34M",
  icon: "X",
  iconBg: "bg-blue-600",
};

// Hardcoded candlestick data for XRP
const xrpCandlestickData = [
  { time: "09:00", open: 2.78, high: 2.82, low: 2.75, close: 2.80, volume: 12500 },
  { time: "10:00", open: 2.80, high: 2.85, low: 2.78, close: 2.83, volume: 13200 },
  { time: "11:00", open: 2.83, high: 2.88, low: 2.81, close: 2.86, volume: 14800 },
  { time: "12:00", open: 2.86, high: 2.92, low: 2.84, close: 2.89, volume: 15600 },
  { time: "13:00", open: 2.89, high: 2.91, low: 2.86, close: 2.88, volume: 14200 },
  { time: "14:00", open: 2.88, high: 2.90, low: 2.85, close: 2.87, volume: 13800 },
  { time: "15:00", open: 2.87, high: 2.89, low: 2.84, close: 2.86, volume: 14500 },
  { time: "16:00", open: 2.86, high: 2.88, low: 2.85, close: 2.8635, volume: 14100 },
];

// Hardcoded order book data for XRP
const xrpOrderBookData = {
  bids: [
    { price: 2.863, amount: 1500, total: 4294.5 },
    { price: 2.862, amount: 2200, total: 6296.4 },
    { price: 2.861, amount: 1800, total: 5149.8 },
    { price: 2.860, amount: 3200, total: 9152 },
    { price: 2.859, amount: 2500, total: 7147.5 },
  ],
  asks: [
    { price: 2.864, amount: 1200, total: 3436.8 },
    { price: 2.865, amount: 1900, total: 5443.5 },
    { price: 2.866, amount: 1600, total: 4585.6 },
    { price: 2.867, amount: 2800, total: 8027.6 },
    { price: 2.868, amount: 2100, total: 6022.8 },
  ],
};

export default function XRPTradePage() {
  return (
    <TradingPageLayout
      asset={xrpAsset}
      candlestickData={xrpCandlestickData}
      orderBookData={xrpOrderBookData}
    />
  );
}
