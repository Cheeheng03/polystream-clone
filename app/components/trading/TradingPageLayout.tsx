"use client";

import React, { useState } from "react";
import { ArrowLeft, Star, Bell, Share, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "../ui/profile-header";
import TabNavigation from "../ui/TabNavigation";
import { PullToRefresh } from "../PullToRefresh";
import { Button } from "../ui/button";

interface TradingAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  icon: string;
  iconBg: string;
}

interface TradingPageLayoutProps {
  asset: TradingAsset;
  candlestickData: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  orderBookData: {
    bids: Array<{ price: number; amount: number; total: number }>;
    asks: Array<{ price: number; amount: number; total: number }>;
  };
}

const LineChart: React.FC<{ data: Array<any> }> = ({ data }) => {
  const maxPrice = Math.max(...data.map(d => d.close));
  const minPrice = Math.min(...data.map(d => d.close));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const adjustedMin = minPrice - padding;
  const adjustedMax = maxPrice + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  const getY = (price: number) => {
    return 200 - ((price - adjustedMin) / adjustedRange) * 200;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * 300;
  };

  // Create smooth path for the line
  const createSmoothPath = (data: any[]) => {
    const points = data.map((point, index) => {
      const x = getX(index);
      const y = getY(point.close);
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

  // Create area path (same as line but with bottom closure)
  const createAreaPath = (data: any[]) => {
    const linePath = createSmoothPath(data);
    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const bottomY = 200;
    
    return `${linePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
  };

  const isPositive = data[data.length - 1].close > data[0].close;
  const lineColor = isPositive ? "#10b981" : "#ef4444";
  const areaColor = isPositive ? "#10b981" : "#ef4444";

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
          d={createAreaPath(data)}
          fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
          opacity="0.1"
        />
        
        {/* Line */}
        <path
          d={createSmoothPath(data)}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const OrderBook: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 h-64">
      <div className="text-white text-sm font-medium mb-4">Order Book</div>
      
      {/* Asks (Sell orders) */}
      <div className="space-y-1 mb-4">
        {data.asks.slice(0, 5).map((ask: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className="text-red-400">{ask.price.toFixed(4)}</span>
            <span className="text-white">{ask.amount.toFixed(2)}</span>
            <div className="w-16 h-4 bg-red-500/20 rounded" style={{ width: `${(ask.total / Math.max(...data.asks.map((a: any) => a.total))) * 64}px` }}></div>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="text-center text-gray-400 text-xs py-2 border-t border-gray-700">
        Spread: {(data.asks[0]?.price - data.bids[0]?.price).toFixed(4)}
      </div>
      
      {/* Bids (Buy orders) */}
      <div className="space-y-1">
        {data.bids.slice(0, 5).map((bid: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <div className="w-16 h-4 bg-green-500/20 rounded" style={{ width: `${(bid.total / Math.max(...data.bids.map((b: any) => b.total))) * 64}px` }}></div>
            <span className="text-white">{bid.amount.toFixed(2)}</span>
            <span className="text-green-400">{bid.price.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TradingInterface: React.FC<{ 
  asset: TradingAsset; 
  orderBookData: any; 
  onCreateOrder: (type: 'buy' | 'sell', amount: number, price: number, total: number) => void;
  orders: Array<{
    id: string;
    type: 'buy' | 'sell';
    asset: string;
    amount: number;
    price: number;
    total: number;
    timestamp: Date;
  }>;
  defaultMode?: 'buy' | 'sell';
}> = ({ asset, orderBookData, onCreateOrder, orders, defaultMode = 'buy' }) => {
  const [isBuy, setIsBuy] = useState(defaultMode === 'buy');
  const [price, setPrice] = useState(asset.price);
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");
  const [orderBookDataState, setOrderBookDataState] = useState(orderBookData);
  const [sliderValue, setSliderValue] = useState(0);
  
  // Mock USDT wallet balance - in a real app, this would come from user data
  const usdtBalance = 1000; // $1000 USDT balance

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    const usdtAmount = (usdtBalance * percentage / 100);
    const calculatedAmount = (usdtAmount / price).toFixed(4);
    setAmount(calculatedAmount);
    setTotal(usdtAmount.toFixed(2));
    setSliderValue(percentage);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const usdtAmount = (usdtBalance * value / 100);
    const calculatedAmount = (usdtAmount / price).toFixed(4);
    setAmount(calculatedAmount);
    setTotal(usdtAmount.toFixed(2));
  };

  const adjustPrice = (increment: boolean) => {
    const step = asset.price >= 1000 ? 1 : asset.price >= 1 ? 0.01 : 0.0001;
    const newPrice = increment ? price + step : Math.max(0, price - step);
    setPrice(Number(newPrice.toFixed(4)));
  };

  const adjustAmount = (increment: boolean) => {
    const currentAmount = parseFloat(amount) || 0;
    const step = currentAmount >= 1 ? 0.1 : 0.001;
    const newAmount = increment ? currentAmount + step : Math.max(0, currentAmount - step);
    setAmount(newAmount.toFixed(4));
    setTotal((newAmount * price).toFixed(2));
  };

  const updateOrderBook = () => {
    // Simulate order book updates
    const newOrderBook = {
      bids: orderBookDataState.bids.map((bid: any) => ({
        ...bid,
        price: bid.price + (Math.random() - 0.5) * 0.001,
        amount: bid.amount + (Math.random() - 0.5) * 0.1,
        total: 0
      })).map((bid: any, index: number, array: any[]) => ({
        ...bid,
        total: array.slice(0, index + 1).reduce((sum, b) => sum + b.amount, 0)
      })),
      asks: orderBookDataState.asks.map((ask: any) => ({
        ...ask,
        price: ask.price + (Math.random() - 0.5) * 0.001,
        amount: ask.amount + (Math.random() - 0.5) * 0.1,
        total: 0
      })).map((ask: any, index: number, array: any[]) => ({
        ...ask,
        total: array.slice(0, index + 1).reduce((sum, a) => sum + a.amount, 0)
      }))
    };
    setOrderBookDataState(newOrderBook);
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
          outline: none;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-top: -6px;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: none;
        }
        
        .slider::-webkit-slider-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 4px;
        }
        
        .slider::-moz-range-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 4px;
          border: none;
        }
        
        .slider:focus {
          outline: none;
        }
        
        .slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.3);
        }
        
        .slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      {/* Order Book Section */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-medium text-gray-700">Order Book</div>
          <button 
            onClick={updateOrderBook}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh
          </button>
        </div>
        
        {/* Headers */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Price (USDT)</span>
          <span>Amount ({asset.symbol})</span>
        </div>
        
        {/* Sell Orders */}
        <div className="space-y-1 mb-2">
          {orderBookDataState.asks.slice(0, 5).map((ask: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-xs relative">
              <span className="text-red-500 font-medium">{formatPrice(ask.price)}</span>
              <span className="text-gray-700">{ask.amount.toFixed(2)}</span>
              <div 
                className="absolute right-0 top-0 h-full bg-red-100 rounded opacity-30" 
                style={{ width: `${(ask.total / Math.max(...orderBookDataState.asks.map((a: any) => a.total))) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        {/* Current Price */}
        <div className="text-center py-2 border-t border-b border-gray-200 my-2">
          <div className="text-lg font-bold text-gray-900">{formatPrice(price)}</div>
          <div className="text-xs text-gray-500">= ${price.toFixed(2)}</div>
        </div>
        
        {/* Buy Orders */}
        <div className="space-y-1">
          {orderBookDataState.bids.slice(0, 5).map((bid: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-xs relative">
              <div 
                className="absolute left-0 top-0 h-full bg-green-100 rounded opacity-30" 
                style={{ width: `${(bid.total / Math.max(...orderBookDataState.bids.map((b: any) => b.total))) * 100}%` }}
              ></div>
              <span className="text-gray-700">{bid.amount.toFixed(2)}</span>
              <span className="text-green-500 font-medium">{formatPrice(bid.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Form */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        {/* Buy/Sell Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setIsBuy(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg text-sm font-medium ${
              isBuy 
                ? "bg-black text-white border-2 border-black" 
                : "bg-gray-100 text-gray-600 border-2 border-gray-300"
            } ${!isBuy ? 'border-r-0' : ''}`}
          >
            Buy
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg text-sm font-medium ${
              !isBuy 
                ? "bg-white text-black border-2 border-black font-semibold" 
                : "bg-gray-100 text-gray-600 border-2 border-gray-300"
            } ${isBuy ? 'border-l-0' : ''}`}
          >
            Sell
          </button>
        </div>

        {/* Price Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => adjustPrice(false)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <button 
              onClick={() => adjustPrice(true)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount {asset.symbol}</label>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => adjustAmount(false)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const newAmount = e.target.value;
                setAmount(newAmount);
                const usdtValue = parseFloat(newAmount) * price;
                setTotal(usdtValue.toFixed(2));
                const percentage = (usdtValue / usdtBalance) * 100;
                setSliderValue(Math.min(100, Math.max(0, percentage)));
              }}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <button 
              onClick={() => adjustAmount(true)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="flex space-x-2 mb-4">
          {[25, 50, 75, 100].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handlePercentageClick(percentage)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                Math.round(sliderValue) === percentage
                  ? "bg-black text-white"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {percentage}%
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Amount</span>
            <span className="text-sm text-gray-500">{sliderValue.toFixed(2)}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #000000 0%, #000000 ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Available: ${usdtBalance.toFixed(2)} USDT • Using: ${(usdtBalance * sliderValue / 100).toFixed(2)} USDT
          </div>
        </div>

        {/* Total Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Total (USDT)</label>
          <input
            type="number"
            value={total}
            onChange={(e) => {
              const usdtValue = parseFloat(e.target.value) || 0;
              setTotal(e.target.value);
              setAmount((usdtValue / price).toFixed(4));
              const percentage = (usdtValue / usdtBalance) * 100;
              setSliderValue(Math.min(100, Math.max(0, percentage)));
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            const amountValue = parseFloat(amount) || 0;
            const totalValue = parseFloat(total) || 0;
            if (amountValue > 0 && totalValue > 0) {
              onCreateOrder(isBuy ? 'buy' : 'sell', amountValue, price, totalValue);
              // Reset form after order
              setAmount("");
              setTotal("");
              setSliderValue(0);
            }
          }}
          disabled={!amount || !total || parseFloat(amount) <= 0 || parseFloat(total) <= 0}
          className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
            isBuy 
              ? "bg-black hover:bg-gray-800 text-white border-2 border-black disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:text-gray-600 disabled:hover:text-gray-600 disabled:border-gray-300 disabled:hover:border-gray-300 disabled:cursor-not-allowed" 
              : "bg-white hover:bg-gray-100 text-black border-2 border-black font-semibold disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:text-gray-600 disabled:hover:text-gray-600 disabled:border-gray-300 disabled:hover:border-gray-300 disabled:cursor-not-allowed"
          }`}
        >
          {isBuy ? `BUY ${asset.symbol}` : `SELL ${asset.symbol}`}
        </button>
      </div>

      {/* Orders Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-3">Recent Orders</div>
        {orders.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">No orders yet</div>
            <div className="text-xs text-gray-400 mt-1">Your buy/sell orders will appear here</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${order.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {order.type.toUpperCase()} {order.asset}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {order.amount.toFixed(4)} {order.asset}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @ ${order.price.toFixed(2)} = ${order.total.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function TradingPageLayout({ asset, candlestickData, orderBookData }: TradingPageLayoutProps) {
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [defaultTradingMode, setDefaultTradingMode] = useState<'buy' | 'sell'>('buy');
  const router = useRouter();
  const [orders, setOrders] = useState<Array<{
    id: string;
    type: 'buy' | 'sell';
    asset: string;
    amount: number;
    price: number;
    total: number;
    timestamp: Date;
  }>>([]);

  // Calculate position from orders
  const calculatePosition = () => {
    const assetOrders = orders.filter(order => order.asset === asset.symbol);
    let totalAmount = 0;
    let totalValue = 0;
    
    assetOrders.forEach(order => {
      if (order.type === 'buy') {
        totalAmount += order.amount;
        totalValue += order.total;
      } else {
        totalAmount -= order.amount;
        totalValue -= order.total;
      }
    });
    
    const averagePrice = totalAmount > 0 ? totalValue / totalAmount : 0;
    const currentValue = totalAmount * asset.price;
    const pnl = currentValue - totalValue;
    const pnlPercent = totalValue > 0 ? (pnl / totalValue) * 100 : 0;
    
    return {
      amount: totalAmount,
      averagePrice,
      totalValue,
      currentValue,
      pnl,
      pnlPercent
    };
  };

  const position = calculatePosition();

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
    return `$${price.toFixed(2)}`;
  };

  const createOrder = (type: 'buy' | 'sell', amount: number, price: number, total: number) => {
    const newOrder = {
      id: Date.now().toString(),
      type,
      asset: asset.symbol,
      amount,
      price,
      total,
      timestamp: new Date()
    };
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    
    // Store in localStorage for persistence (MVP cache)
    const existingOrders = JSON.parse(localStorage.getItem('tradingOrders') || '[]');
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem('tradingOrders', JSON.stringify(updatedOrders));
  };

  // Load orders from localStorage on component mount
  React.useEffect(() => {
    const savedOrders = localStorage.getItem('tradingOrders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders.map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp)
        })));
      } catch (error) {
        console.error('Error loading orders from cache:', error);
      }
    }
  }, []);

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
              onClick={() => {
                if (showTrading) {
                  setShowTrading(false);
                } else {
                  router.push('/tap-trade');
                }
              }}
              className="flex items-center"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">{asset.symbol}/USDT</div>
              <div className="text-sm text-muted-foreground">{asset.name}</div>
            </div>
            <div className="flex space-x-3">
              <Star className="w-5 h-5 text-muted-foreground" />
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Share className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Price and Stats */}
          <div className="bg-white rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-full ${asset.iconBg} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {asset.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(asset.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatUsdPrice(asset.price)}
                  </div>
                </div>
              </div>
              <div className={`flex items-center text-lg font-semibold ${
                asset.change >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {asset.change >= 0 ? (
                  <TrendingUp className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1" />
                )}
                {asset.change >= 0 ? "+" : ""}
                {asset.changePercent.toFixed(2)}%
              </div>
            </div>

            {/* 24h Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">24h High</div>
                <div className="font-semibold">{formatPrice(asset.high24h)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">24h Low</div>
                <div className="font-semibold">{formatPrice(asset.low24h)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">24h Volume</div>
                <div className="font-semibold">{asset.volume24h}</div>
              </div>
            </div>
          </div>

          {/* Chart, Order Book, or Trading Interface */}
          {showTrading ? (
            <TradingInterface asset={asset} orderBookData={orderBookData} onCreateOrder={createOrder} orders={orders} defaultMode={defaultTradingMode} />
          ) : showOrderBook ? (
            <OrderBook data={orderBookData} />
          ) : (
            <>
              <LineChart data={candlestickData} />
              {/* Time Frame Buttons */}
              <div className="flex space-x-2 mt-4 justify-center">
                {["30m", "1H", "4H", "1D", "7D"].map((timeframe) => (
                  <button
                    key={timeframe}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      timeframe === "30m"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Position Info */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Your Position</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold text-foreground">
                  ${position.currentValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {position.amount.toFixed(4)} {asset.symbol}
                </div>
                {position.amount > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg: ${position.averagePrice.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">P&L</div>
                <div className="text-lg font-semibold text-green-600">
                  {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                </div>
                {position.amount > 0 && (
                  <div className="text-xs text-green-600">
                    {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
            {position.amount === 0 && (
              <div className="text-center py-2">
                <div className="text-sm text-gray-500">No position yet</div>
                <div className="text-xs text-gray-400 mt-1">Start trading to build your position</div>
              </div>
            )}
          </div>

          {/* Buy/Sell Buttons */}
          {!showTrading && (
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={() => {
                  setDefaultTradingMode('buy');
                  setShowTrading(true);
                }}
                className="flex-1 h-10 text-sm font-medium bg-black hover:bg-gray-800 text-white rounded-lg"
              >
                BUY
              </Button>
              <Button
                onClick={() => {
                  setDefaultTradingMode('sell');
                  setShowTrading(true);
                }}
                className="flex-1 h-10 text-sm font-medium bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg"
              >
                SELL
              </Button>
            </div>
          )}

        </div>
      </PullToRefresh>

      <TabNavigation activeTab="tap-trade" />
    </main>
  );
}
