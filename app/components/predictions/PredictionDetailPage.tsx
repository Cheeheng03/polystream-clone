"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, Calendar, BarChart3, Info, ChevronDown } from "lucide-react";
import { ProfileHeader } from "../ui/profile-header";
import TabNavigation from "../ui/TabNavigation";
import { PullToRefresh } from "../PullToRefresh";
import { Button } from "../ui/button";

interface PredictionMarket {
  id: string;
  title: string;
  chance: number;
  volume: string;
  endDate: string;
  icon: string;
  priceYes: number;
  priceNo: number;
  change: number;
  chartData: Array<{ month: string; probability: number }>;
  orderBook: {
    bids: Array<{ price: number; amount: number; total: number }>;
    asks: Array<{ price: number; amount: number; total: number }>;
  };
  marketContext: string;
  relatedMarkets: Array<{
    id: string;
    title: string;
    probability: number;
    icon: string;
  }>;
}

interface PredictionDetailPageProps {
  market: PredictionMarket;
}

const PredictionDetailPage: React.FC<PredictionDetailPageProps> = ({ market }) => {
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState("");
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showMarketContext, setShowMarketContext] = useState(false);
  const [usdcBalance] = useState(1000); // Hardcoded USDC balance
  const [userPosition, setUserPosition] = useState({
    yesShares: 0,
    noShares: 0,
    totalValue: 0,
    pnl: 0,
    pnlPercent: 0
  });
  const searchParams = useSearchParams();

  // Handle URL parameter for pre-selecting outcome
  useEffect(() => {
    const outcomeParam = searchParams.get('outcome');
    if (outcomeParam === 'yes' || outcomeParam === 'no') {
      setSelectedOutcome(outcomeParam);
    }
  }, [searchParams]);

  // Load user position from localStorage
  useEffect(() => {
    const loadUserPosition = () => {
      const trades = JSON.parse(localStorage.getItem(`trades_${market.id}`) || '[]');
      
      let yesShares = 0;
      let noShares = 0;
      let totalInvested = 0;

      trades.forEach((trade: any) => {
        if (trade.outcome === 'yes') {
          if (trade.type === 'buy') {
            yesShares += trade.shares;
            totalInvested += trade.amount;
          } else {
            yesShares -= trade.shares;
            totalInvested -= trade.amount;
          }
        } else {
          if (trade.type === 'buy') {
            noShares += trade.shares;
            totalInvested += trade.amount;
          } else {
            noShares -= trade.shares;
            totalInvested -= trade.amount;
          }
        }
      });

      const currentYesValue = yesShares * market.priceYes;
      const currentNoValue = noShares * market.priceNo;
      const totalValue = currentYesValue + currentNoValue;
      const pnl = totalValue - totalInvested;
      const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

      setUserPosition({
        yesShares: Math.max(0, yesShares),
        noShares: Math.max(0, noShares),
        totalValue,
        pnl,
        pnlPercent
      });
    };

    loadUserPosition();
  }, [market.id, market.priceYes, market.priceNo]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleMaxAmount = () => {
    setAmount(usdcBalance.toString());
  };

  const executeTrade = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const tradeAmount = parseFloat(amount);
    const price = selectedOutcome === 'yes' ? market.priceYes : market.priceNo;
    const shares = tradeAmount / price;

    const trade = {
      id: Date.now().toString(),
      type: activeTab,
      outcome: selectedOutcome,
      amount: tradeAmount,
      price: price,
      shares: shares,
      timestamp: new Date().toISOString()
    };

    // Save trade to localStorage
    const existingTrades = JSON.parse(localStorage.getItem(`trades_${market.id}`) || '[]');
    existingTrades.push(trade);
    localStorage.setItem(`trades_${market.id}`, JSON.stringify(existingTrades));

    // Update position
    const newTrades = [...existingTrades];
    let yesShares = 0;
    let noShares = 0;
    let totalInvested = 0;

    newTrades.forEach((t: any) => {
      if (t.outcome === 'yes') {
        if (t.type === 'buy') {
          yesShares += t.shares;
          totalInvested += t.amount;
        } else {
          yesShares -= t.shares;
          totalInvested -= t.amount;
        }
      } else {
        if (t.type === 'buy') {
          noShares += t.shares;
          totalInvested += t.amount;
        } else {
          noShares -= t.shares;
          totalInvested -= t.amount;
        }
      }
    });

    const currentYesValue = yesShares * market.priceYes;
    const currentNoValue = noShares * market.priceNo;
    const totalValue = currentYesValue + currentNoValue;
    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    setUserPosition({
      yesShares: Math.max(0, yesShares),
      noShares: Math.max(0, noShares),
      totalValue,
      pnl,
      pnlPercent
    });

    // Reset form
    setAmount("");
  };

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(0)}¢`;
  };

  const calculateShares = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    const price = selectedOutcome === 'yes' ? market.priceYes : market.priceNo;
    return parseFloat(amount) / price;
  };

  const LineChart: React.FC<{ data: Array<{ month: string; probability: number }> }> = ({ data }) => {
    if (data.length < 2) return null;

    const maxProb = Math.max(...data.map(d => d.probability));
    const minProb = Math.min(...data.map(d => d.probability));
    const range = maxProb - minProb;
    const padding = range * 0.1;
    const adjustedMin = Math.max(0, minProb - padding);
    const adjustedMax = Math.min(100, maxProb + padding);
    const adjustedRange = adjustedMax - adjustedMin;

    const createPath = (data: Array<{ month: string; probability: number }>) => {
      const points = data.map((d, index) => {
        const x = (index / (data.length - 1)) * 300;
        const y = 200 - ((d.probability - adjustedMin) / adjustedRange) * 180;
        return { x, y };
      });

      let path = `M${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        if (next) {
          const cp1x = prev.x + (curr.x - prev.x) * 0.5;
          const cp1y = prev.y;
          const cp2x = curr.x - (next.x - curr.x) * 0.5;
          const cp2y = curr.y;
          path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        } else {
          path += ` L${curr.x},${curr.y}`;
        }
      }
      return path;
    };

    const isPositive = data[data.length - 1].probability > data[0].probability;
    const lineColor = isPositive ? "#10b981" : "#ef4444";

    return (
      <div className="bg-white rounded-lg p-4 h-64 border border-gray-200">
        <svg width="100%" height="200" viewBox="0 0 300 200" className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line 
              key={ratio} 
              x1="0" 
              y1={200 * ratio} 
              x2="300" 
              y2={200 * ratio} 
              stroke="#e5e7eb" 
              strokeWidth="1" 
              opacity="0.5" 
            />
          ))}
          {/* Area fill */}
          <path 
            d={`${createPath(data)} L300,200 L0,200 Z`} 
            fill={lineColor} 
            opacity="0.1" 
          />
          {/* Line */}
          <path 
            d={createPath(data)} 
            fill="none" 
            stroke={lineColor} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <ProfileHeader
        showName={true}
        onSheetOpenChange={setIsProfileSheetOpen}
      />

      <PullToRefresh refreshType="trade">
        <div
          className={`flex-1 px-4 pb-32 transition-all duration-200 ${
            isProfileSheetOpen ? "blur-sm" : ""
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">{market.title}</div>
            </div>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>

          {/* Market Stats */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                {market.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{market.title}</div>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{market.volume} Vol.</span>
                  <span>•</span>
                  <span>{market.endDate}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-foreground">
                {market.chance}% chance
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">+{market.change}%</span>
              </div>
            </div>
          </div>

          {/* Your Position */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm font-semibold text-foreground mb-3">Your Position</div>
            {userPosition.yesShares > 0 || userPosition.noShares > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${userPosition.totalValue.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium">YES Shares</div>
                    <div className="text-sm font-semibold text-green-800">
                      {userPosition.yesShares.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">
                      ${(userPosition.yesShares * market.priceYes).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 font-medium">NO Shares</div>
                    <div className="text-sm font-semibold text-red-800">
                      {userPosition.noShares.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-600">
                      ${(userPosition.noShares * market.priceNo).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="text-sm text-muted-foreground">P&L</div>
                  <div className={`text-sm font-semibold ${userPosition.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {userPosition.pnl >= 0 ? '+' : ''}${userPosition.pnl.toFixed(2)} ({userPosition.pnlPercent >= 0 ? '+' : ''}{userPosition.pnlPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">No position yet</div>
                <div className="text-xs text-gray-400 mt-1">Start trading to build your position</div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="mb-4">
            <LineChart data={market.chartData} />
            
            {/* Timeframe Selector */}
            <div className="flex space-x-2 mt-4 justify-center">
              {["1H", "6H", "1D", "1W", "1M", "ALL"].map((timeframe) => (
                <button
                  key={timeframe}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    timeframe === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          {/* Trading Interface */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'buy'
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'sell'
                      ? "bg-red-100 text-red-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Sell
                </button>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-2 py-1">
                <option>Market</option>
              </select>
            </div>

            {/* Outcome Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedOutcome('yes')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedOutcome === 'yes'
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">Yes {formatPrice(market.priceYes)}</div>
                  <div className="text-sm text-muted-foreground">{market.chance}%</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedOutcome('no')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedOutcome === 'no'
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">No {formatPrice(market.priceNo)}</div>
                  <div className="text-sm text-muted-foreground">{100 - market.chance}%</div>
                </div>
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="$0"
                  className="w-full p-3 border border-gray-200 rounded-lg text-lg font-semibold"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  USDC
                </div>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex space-x-2 mt-2">
                {[1, 20, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    +${value}
                  </button>
                ))}
                <button
                  onClick={handleMaxAmount}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Trade Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-semibold">{calculateShares().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">{formatPrice(selectedOutcome === 'yes' ? market.priceYes : market.priceNo)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">${amount}</span>
                </div>
              </div>
            )}

            {/* Trade Button */}
            <Button
              onClick={executeTrade}
              disabled={!amount || parseFloat(amount) <= 0}
              className={`w-full h-12 text-lg font-semibold rounded-lg ${
                activeTab === 'buy'
                  ? "bg-black hover:bg-gray-800 text-white border-2 border-black"
                  : "bg-white hover:bg-gray-100 text-black border-2 border-black"
              } disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-gray-600 disabled:hover:text-gray-600 disabled:border-gray-400 disabled:hover:border-gray-400 disabled:cursor-not-allowed`}
            >
              {activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedOutcome === 'yes' ? 'Yes' : 'No'}
            </Button>

            <div className="text-xs text-muted-foreground text-center mt-2">
              By trading, you agree to the Terms of Use.
            </div>
          </div>

          {/* Order Book */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <button
              onClick={() => setShowOrderBook(!showOrderBook)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Order Book</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showOrderBook ? 'rotate-180' : ''}`} />
            </button>
            
            {showOrderBook && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground">
                  <span>Price</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Total</span>
                </div>
                
                {/* Sell Orders */}
                {market.orderBook.asks.slice(0, 5).map((order, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                    <span className="text-red-600">{formatPrice(order.price)}</span>
                    <span className="text-center">{order.amount.toFixed(2)}</span>
                    <span className="text-right">{order.total.toFixed(0)}</span>
                  </div>
                ))}
                
                {/* Current Price */}
                <div className="grid grid-cols-3 gap-4 text-sm font-bold py-2 border-t border-b border-gray-200">
                  <span className="text-foreground">{formatPrice(market.priceYes)}</span>
                  <span className="text-center text-foreground">Current</span>
                  <span className="text-right text-foreground">{formatPrice(market.priceNo)}</span>
                </div>
                
                {/* Buy Orders */}
                {market.orderBook.bids.slice(0, 5).map((order, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                    <span className="text-green-600">{formatPrice(order.price)}</span>
                    <span className="text-center">{order.amount.toFixed(2)}</span>
                    <span className="text-right">{order.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Context */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <button
              onClick={() => setShowMarketContext(!showMarketContext)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Market Context</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMarketContext ? 'rotate-180' : ''}`} />
            </button>
            
            {showMarketContext && (
              <div className="mt-4 text-sm text-muted-foreground">
                {market.marketContext}
              </div>
            )}
          </div>

          {/* Related Markets */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex space-x-4 mb-4">
              {["All", "Politics", "Trump", "Trump Presiden"].map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    category === "All"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              {market.relatedMarkets.map((relatedMarket) => (
                <div key={relatedMarket.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {relatedMarket.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{relatedMarket.title}</div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {relatedMarket.probability}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PullToRefresh>

      <TabNavigation activeTab="news-market" />
    </main>
  );
};

export default PredictionDetailPage;
