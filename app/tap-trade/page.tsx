"use client";

import React, { useState } from "react";
import TabNavigation from "../components/ui/TabNavigation";
import { ProfileHeader } from "../components/ui/profile-header";
import { PullToRefresh } from "../components/PullToRefresh";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, ChevronUp, ChevronDown, TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";
import Link from "next/link";

// Ethereum Icon Component
const EthereumIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    className="text-white"
  >
    <title>Ethereum icon</title>
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003z" />
    <path d="M12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
  </svg>
);

// Hardcoded trading data for the 4 assets
const tradingData = [
  {
    id: "btc-usdt",
    symbol: "BTC",
    name: "Bitcoin",
    pair: "BTC / USDT",
    volume: "543.07M",
    price: 111762.17,
    usdPrice: 111770.81,
    change: 2.10,
    changeType: "positive",
    icon: "₿",
    iconBg: "bg-orange-500",
  },
  {
    id: "eth-usdt",
    symbol: "ETH",
    name: "Ethereum",
    pair: "ETH / USDT",
    volume: "662.47M",
    price: 4111.95,
    usdPrice: 4112.26,
    change: 2.70,
    changeType: "positive",
    icon: <EthereumIcon />,
    iconBg: "bg-blue-500",
  },
  {
    id: "xrp-usdt",
    symbol: "XRP",
    name: "XRP",
    pair: "XRP / USDT",
    volume: "75.34M",
    price: 2.8635,
    usdPrice: 2.86,
    change: 2.86,
    changeType: "positive",
    icon: "X",
    iconBg: "bg-blue-600",
  },
  {
    id: "scr-usdt",
    symbol: "SCR",
    name: "Scroll",
    pair: "SCR / USDT",
    volume: "109.7K",
    price: 0.2866,
    usdPrice: 0.28,
    change: 2.87,
    changeType: "positive",
    icon: "S",
    iconBg: "bg-amber-200",
  },
];

export default function TapTrade() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "change" | "volume">("change");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"All" | "Spot" | "Futures" | "Margin">("All");
  const [activeMainTab, setActiveMainTab] = useState<"Favorites" | "Markets">("Markets");

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  const formatUsdPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const handleSort = (column: "price" | "change" | "volume") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const filteredData = tradingData.filter((item) =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by sub-tab (All shows everything, Spot shows spot trading data)
  const getFilteredDataByTab = () => {
    if (activeSubTab === "All" || activeSubTab === "Spot") {
      return filteredData;
    }
    // For Futures and Margin, return empty array to show coming soon
    return [];
  };

  const displayData = getFilteredDataByTab();

  const sortedData = [...displayData].sort((a, b) => {
    let aValue: number, bValue: number;
    
    switch (sortBy) {
      case "price":
        aValue = a.price;
        bValue = b.price;
        break;
      case "change":
        aValue = a.change;
        bValue = b.change;
        break;
      case "volume":
        aValue = parseFloat(a.volume.replace(/[KM]/g, (match) => 
          match === 'K' ? '000' : '000000'
        ));
        bValue = parseFloat(b.volume.replace(/[KM]/g, (match) => 
          match === 'K' ? '000' : '000000'
        ));
        break;
      default:
        return 0;
    }
    
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <ProfileHeader
        showName={true}
        onSheetOpenChange={setIsProfileSheetOpen}
      />

      <PullToRefresh refreshType="trade">
        <div
          className={`flex-1 px-4 pb-20 transition-all duration-200 ${
            isProfileSheetOpen ? "blur-sm" : ""
          }`}
        >
          {/* Search Bar */}
          <div className="mt-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 rounded-xl h-12"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 mb-6">
            {["Favorites", "Markets"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab as "Favorites" | "Markets")}
                className={`text-sm font-medium pb-2 transition-all duration-200 ${
                  activeMainTab === tab
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-4 mb-6">
            {["All", "Spot", "Futures", "Margin"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab as "All" | "Spot" | "Futures" | "Margin")}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-200 ${
                  activeSubTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Market Data Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => handleSort("volume")}
                className="flex items-center text-xs font-medium text-muted-foreground col-span-6"
              >
                Coin/Volume
                {sortBy === "volume" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp className="ml-1 w-3 h-3" />
                  ) : (
                    <ChevronDown className="ml-1 w-3 h-3" />
                  )
                ) : null}
              </button>
              <button
                onClick={() => handleSort("price")}
                className="flex items-center text-xs font-medium text-muted-foreground col-span-3 text-right justify-end"
              >
                Price
                {sortBy === "price" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp className="ml-1 w-3 h-3" />
                  ) : (
                    <ChevronDown className="ml-1 w-3 h-3" />
                  )
                ) : null}
              </button>
              <button
                onClick={() => handleSort("change")}
                className="flex items-center text-xs font-medium text-muted-foreground col-span-3 text-right justify-end"
              >
                Change
                {sortBy === "change" ? (
                  sortOrder === "asc" ? (
                    <ChevronUp className="ml-1 w-3 h-3" />
                  ) : (
                    <ChevronDown className="ml-1 w-3 h-3" />
                  )
                ) : null}
              </button>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {sortedData.length > 0 ? (
                sortedData.map((item) => {
                  const getTradeLink = (symbol: string) => {
                    switch (symbol) {
                      case "BTC": return "/btc-trade";
                      case "ETH": return "/eth-trade";
                      case "XRP": return "/xrp-trade";
                      case "SCR": return "/scr-trade";
                      default: return "/tap-trade";
                    }
                  };

                  return (
                    <Link key={item.id} href={getTradeLink(item.symbol)}>
                      <div className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer items-center">
                        {/* Coin/Volume Column */}
                        <div className="flex items-center space-x-3 col-span-6">
                          <div
                            className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center text-white font-bold text-sm`}
                          >
                            {typeof item.icon === 'string' ? item.icon : item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{item.symbol}</span>
                              <span className="text-xs text-muted-foreground">/ USDT</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{item.volume}</div>
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="text-right col-span-3">
                          <div className="font-medium text-foreground">
                            {formatPrice(item.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatUsdPrice(item.usdPrice)}
                          </div>
                        </div>

                        {/* Change Column */}
                        <div className="text-right col-span-3">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              item.changeType === "positive"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.changeType === "positive" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {item.changeType === "positive" ? "+" : ""}
                            {item.change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-300 to-yellow-300 rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="w-8 h-8 text-green-800" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full flex items-center justify-center animate-bounce">
                      <Clock className="w-3 h-3 text-green-800" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-sm text-green-600 text-center max-w-xs">
                    {activeSubTab === "Futures" 
                      ? "Futures trading is under development. Stay tuned for advanced trading features!"
                      : "Margin trading is coming soon. Get ready for leveraged trading opportunities!"
                    }
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>

      <TabNavigation activeTab="tap-trade" />
    </main>
  );
}
