"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Token configurations with Pyth price feed IDs - only ETH now
const TOKEN_CONFIG = {
  'ethereum': {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '/token/eth.png',
    pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
    color: '#16a34a' // Green color for chart
  }
};

// Pyth API endpoints
const PYTH_ENDPOINTS = {
  // Real-time price data
  latest: 'https://hermes.pyth.network/api/latest_price_feeds',
  // Historical price data  
  historical: 'https://benchmarks.pyth.network/v1/shims/tradingview/history'
};

// Enhanced chart component with interactive tooltips and crosshairs
const PriceChart = ({ data, color }: { data: Array<[number, number]>, color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    timestamp: number;
  }>({ visible: false, x: 0, y: 0, price: 0, timestamp: 0 });
  const [crosshair, setCrosshair] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    if (!data.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get price range
    const prices = data.map(([, price]) => price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = (i / 5) * rect.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw chart line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const chartPoints: Array<{x: number, y: number, price: number, timestamp: number}> = [];

    data.forEach(([timestamp, price], index) => {
      const x = (index / Math.max(data.length - 1, 1)) * rect.width;
      const y = rect.height - ((price - minPrice) / priceRange) * rect.height;

      chartPoints.push({ x, y, price, timestamp });

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add gradient fill
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    ctx.lineTo(rect.width, rect.height);
    ctx.lineTo(0, rect.height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw crosshairs if visible
    if (crosshair.visible) {
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, rect.height);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(rect.width, crosshair.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    // Store chart points for tooltip interaction
    (canvas as any).chartPoints = chartPoints;
    (canvas as any).chartRect = rect;
    (canvas as any).priceRange = { minPrice, maxPrice, priceRange };
  }, [data, color, crosshair]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !(canvas as any).chartPoints) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update crosshair position
    setCrosshair({
      visible: true,
      x: mouseX,
      y: mouseY
    });

    const chartPoints = (canvas as any).chartPoints as Array<{x: number, y: number, price: number, timestamp: number}>;
    
    // Find the closest point
    let closestPoint = null as {x: number, y: number, price: number, timestamp: number} | null;
    let minDistance = Infinity;

    chartPoints.forEach((point) => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint && minDistance < 50) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        price: closestPoint.price,
        timestamp: closestPoint.timestamp
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setCrosshair(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-96 rounded-lg border cursor-crosshair"
        style={{ width: '100%', height: '384px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none shadow-lg"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 60,
            transform: tooltip.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-semibold">${tooltip.price.toFixed(2)}</div>
          <div className="text-gray-300 text-xs">
            {new Date(tooltip.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default function TokenChartPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params?.token as string;
  
  const [timeframe, setTimeframe] = useState('1'); // 1 day default for real-time
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const tokenConfig = TOKEN_CONFIG[tokenId as keyof typeof TOKEN_CONFIG];

  // Cache all timeframe data using React Query with 10 minute cache
  const { data: allChartData, isLoading } = useQuery({
    queryKey: ['ethChartData', tokenConfig?.pythId],
    queryFn: async () => {
      if (!tokenConfig) throw new Error('No token config');
      
      // Fetch all timeframes in parallel
      const [data1d, data7d, data30d, data1y] = await Promise.all([
        fetchHistoricalDataForTimeframe('1'),
        fetchHistoricalDataForTimeframe('7'),
        fetchHistoricalDataForTimeframe('30'),
        fetchHistoricalDataForTimeframe('365')
      ]);
      
      return {
        '1': data1d,
        '7': data7d,
        '30': data30d,
        '365': data1y
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!tokenConfig
  });

  // Cache real-time price - but we'll override with direct fetching
  const { data: cachedPrice } = useQuery({
    queryKey: ['ethRealTimePrice', tokenConfig?.pythId],
    queryFn: () => fetchRealTimePrice(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache for fallback
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!tokenConfig
  });

  // Get current chart data based on selected timeframe
  const currentChartData = allChartData?.[timeframe as keyof typeof allChartData] || [];

  // Calculate price change using real-time current price vs historical start price
  const priceChange = currentChartData.length > 0 && currentPrice > 0
    ? ((currentPrice - currentChartData[0][1]) / currentChartData[0][1]) * 100
    : 0;

  // Fetch real-time price from Pyth with cache busting
  const fetchRealTimePrice = async () => {
    if (!tokenConfig) return null;
    
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(
        `${PYTH_ENDPOINTS.latest}?ids[]=${tokenConfig.pythId}&verbose=true&_t=${timestamp}`,
        {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch real-time price`);
      
      const data = await response.json();
      
      // Handle different response formats
      let priceData = null;
      
      if (Array.isArray(data) && data.length > 0) {
        // Direct array response
        priceData = data[0];
      } else if (data.parsed && Array.isArray(data.parsed) && data.parsed.length > 0) {
        // Wrapped in parsed property
        priceData = data.parsed[0];
      }
      
      
      if (priceData?.price) {
        const price = parseFloat(priceData.price.price) * Math.pow(10, priceData.price.expo);
        const confidence = parseFloat(priceData.price.conf) * Math.pow(10, priceData.price.expo);
        const publishTime = priceData.price.publish_time * 1000; // Convert to milliseconds
                
        return {
          price,
          confidence,
          publishTime
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching real-time price:', error);
      return null;
    }
  };

  // Fetch historical data for a specific timeframe
  const fetchHistoricalDataForTimeframe = async (days: string) => {
    if (!tokenConfig) return [];
    
    try {
      const now = Math.floor(Date.now() / 1000);
      const daysAgo = parseInt(days);
      const from = now - (daysAgo * 24 * 60 * 60);
      
      // Get resolution based on timeframe
      const resolution = daysAgo <= 1 ? '1' : daysAgo <= 7 ? '15' : daysAgo <= 30 ? '60' : '1D';
      
      const response = await fetch(
        `${PYTH_ENDPOINTS.historical}?symbol=Crypto.${tokenConfig.symbol}/USD&resolution=${resolution}&from=${from}&to=${now}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch historical data');
      
      const data = await response.json();
      
      if (data.s === 'ok' && data.t && data.c) {
        return data.t.map((timestamp: number, index: number) => [
          timestamp * 1000, // Convert to milliseconds
          data.c[index] // Close price
        ]);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching ${days}d historical data:`, error);
      // Return mock data as fallback
      const mockData = Array.from({ length: Math.min(parseInt(days) * 24, 365) }, (_, i) => [
        Date.now() - (parseInt(days) * 24 - i) * 60 * 60 * 1000,
        Math.random() * 200 + 3000 // ETH price range
      ]) as Array<[number, number]>;
      return mockData;
    }
  };

  // Real-time price fetching with direct interval (bypasses React Query caching)
  useEffect(() => {
    if (!tokenConfig) return;

    // Initial load from cached data
    if (cachedPrice?.price && currentPrice === 0) {
      setCurrentPrice(cachedPrice.price);
      setLastUpdate(cachedPrice.publishTime);
    }

    // Immediate first fetch
    const fetchImmediate = async () => {
      try {
        const latestPrice = await fetchRealTimePrice();
        if (latestPrice?.price) {
          setCurrentPrice(latestPrice.price);
          setLastUpdate(latestPrice.publishTime);
        }
      } catch (error) {
        console.error('Error in immediate fetch:', error);
      }
    };

    fetchImmediate();

    // Set up real-time interval
    const interval = setInterval(async () => {
      try {
        const latestPrice = await fetchRealTimePrice();
        if (latestPrice?.price) {
          setCurrentPrice(latestPrice.price);
          setLastUpdate(latestPrice.publishTime);
        }
      } catch (error) {
        console.error('Error fetching real-time price:', error);
      }
    }, 2000); // Update every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [tokenConfig]); // Removed dependencies to prevent effect re-running

  // Fallback to chart data if no real-time price available
  useEffect(() => {
    if (currentChartData.length > 0 && currentPrice === 0 && !cachedPrice) {
      setCurrentPrice(currentChartData[currentChartData.length - 1][1]);
      setLastUpdate(Date.now());
    }
  }, [currentChartData, currentPrice, cachedPrice]);

  const handleTradeClick = () => {
    router.push('/swap');
  };

  if (!tokenConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Token Not Found</h1>
          <p className="text-gray-600">The token you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Full page loading skeleton on initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* Price Section Skeleton */}
        <div className="px-4 py-8">
          <div className="text-center mb-8">
            <div className="h-12 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>

          {/* Timeframe Skeleton */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse mb-8" />

          {/* Button Skeleton */}
          <div className="flex justify-center">
            <div className="h-14 w-32 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <img src={tokenConfig.icon} alt={tokenConfig.name} className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-semibold">{tokenConfig.name}</h1>
              <p className="text-sm text-gray-500">{tokenConfig.symbol}</p>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Price Section */}
      <div className="px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            ${currentPrice.toFixed(2)}
          </h2>
          <div className={`flex items-center justify-center gap-1 ${
            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="font-medium text-lg">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            <span className="text-gray-500">({timeframe}d)</span>
          </div>
          <div className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Data
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {['1', '7', '30', '365'].map((days) => (
            <Button
              key={days}
              variant={timeframe === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(days)}
              className="px-6 py-2"
            >
              {days === '1' ? '24H' : days === '365' ? '1Y' : `${days}D`}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="mb-8">
          <PriceChart data={currentChartData} color={tokenConfig.color} />
        </div>

        {/* Trade Button - Big and Eye-catching */}
        <div className="flex justify-center px-4">
          <Button
            onClick={handleTradeClick}
            className="bg-black text-white rounded-3xl py-6 px-12 font-bold text-lg flex items-center gap-3 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 w-full max-w-xs"
          >
            <ArrowLeftRight className="w-6 h-6" />
            Trade ETH
          </Button>
        </div>
      </div>
    </div>
  );
} 