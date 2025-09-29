import React from "react";
import Link from "next/link";

// Custom SVG Chart Component with smooth curves
const WavyChart: React.FC<{ data: number[]; isPositive: boolean; width?: number; height?: number }> = ({ 
  data, 
  isPositive, 
  width = 64, 
  height = 24 
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = range * 0.15; // 15% padding for better visualization
  const adjustedMin = min - padding;
  const adjustedMax = max + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  // Create smooth curve using cubic bezier curves
  const createSmoothPath = (data: number[]) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - adjustedMin) / adjustedRange) * height;
      return { x, y };
    });

    let path = `M${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        // Create control points for smooth curves
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.5;
        const cp2y = curr.y;
        
        path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
      } else {
        // Last point - simple line
        path += ` L${curr.x},${curr.y}`;
      }
    }
    
    return path;
  };

  const color = isPositive ? "#10b981" : "#ef4444";
  const pathData = createSmoothPath(data);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Custom icon components for better control
const BitcoinIcon = () => (
  <span className="text-white font-bold text-sm">₿</span>
);

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
)

const XRPIcon = () => (
  <span className="text-white font-bold text-sm">X</span>
);

const ScrollIcon = () => (
  <span className="text-white font-bold text-sm">S</span>
);

// Hardcoded data for the top assets - matching trading interface chart patterns
const topAssetsData = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 111677.35,
    change: 2.03,
    icon: BitcoinIcon,
    iconBg: "bg-orange-500",
    chartData: [108000, 109500, 111000, 112500, 113800, 112200, 110800, 111677],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 4111.17,
    change: 2.72,
    icon: EthereumIcon,
    iconBg: "bg-blue-500",
    chartData: [3950, 4000, 4050, 4100, 4150, 4080, 4090, 4111],
  },
  {
    id: "xrp",
    name: "XRP",
    symbol: "XRP",
    price: 2.8753,
    change: 3.19,
    icon: XRPIcon,
    iconBg: "bg-blue-600",
    chartData: [2.68, 2.72, 2.78, 2.85, 2.90, 2.82, 2.86, 2.8753],
  },
  {
    id: "scroll",
    name: "Scroll",
    symbol: "SCR",
    price: 0.2857,
    change: 2.66,
    icon: ScrollIcon,
    iconBg: "bg-amber-200",
    chartData: [0.34, 0.355, 0.32, 0.3577, 0.29, 0.265, 0.2585, 0.275, 0.2857],
  },
];

const TopAssets: React.FC = () => {
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  const getTradeLink = (symbol: string) => {
    const symbolMap: { [key: string]: string } = {
      'BTC': '/btc-trade',
      'ETH': '/eth-trade',
      'XRP': '/xrp-trade',
      'SCR': '/scr-trade'
    };
    return symbolMap[symbol] || '#';
  };

  return (
    <section className="animate-fade-in animation-delay-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Top Assets</h2>
      </div>
      <div className="space-y-2">
        {topAssetsData.map((asset) => (
          <Link key={asset.id} href={getTradeLink(asset.symbol)}>
            <div className="activity-card card-tap-effect">
            <div className="activity-card-content">
              <div className="flex justify-between items-center">
                {/* Asset Icon and Name - Fixed width */}
                <div className="flex items-center gap-3 w-24">
                  <div
                    className={`${asset.iconBg} flex items-center justify-center`}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      minWidth: '32px',
                      minHeight: '32px'
                    }}
                  >
                    <asset.icon />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                  </div>
                </div>

                {/* Chart - Fixed width */}
                <div className="w-16 h-6 mx-2 flex items-center justify-center">
                  <WavyChart 
                    data={asset.chartData} 
                    isPositive={asset.change >= 0}
                    width={64}
                    height={24}
                  />
                </div>

                {/* Price and Change - Fixed width */}
                <div className="text-right w-20">
                  <div className="font-semibold text-foreground text-sm">
                    {formatPrice(asset.price)}
                  </div>
                  <div className={`text-xs font-medium ${getChangeColor(asset.change)}`}>
                    {formatChange(asset.change)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopAssets;
