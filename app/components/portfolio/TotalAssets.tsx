import React, { useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import {
  FiMaximize2,
  FiArrowUpRight,
  FiChevronUp,
  FiArrowDownRight,
} from "react-icons/fi";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useTotalAssets, useAssetHistory } from "../../lib/hooks";
import { Skeleton } from "../ui/skeleton";

const timeframes = ["1w", "1m", "1y"] as const;
type Timeframe = (typeof timeframes)[number];

const TotalAssets: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1w");
  const [hideBalance, setHideBalance] = useState(false);
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Fetch total assets and asset history using our hooks
  const { totalAssets, isLoading } = useTotalAssets();
  const { data: assetHistory, isLoading: historyLoading } = useAssetHistory();

  // Process and aggregate data based on timeframe
  const chartData = React.useMemo(() => {
    if (!assetHistory?.data || assetHistory.data.length === 0) { 
      return [];
    }

    const rawData = assetHistory.data;
    const now = new Date();

    let processedData = [];

    switch (selectedTimeframe) {
      case "1w": {
        // Last 7 days
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        processedData = rawData
          .filter((item: any) => new Date(item.timestamp) >= weekAgo)
          .map((item: any) => ({
            label: new Date(item.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: item.amount,
            originalTimestamp: item.timestamp,
          }));
        break;
      }

      case "1m": {
        // Last 30 days, group by week
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const filteredData = rawData.filter(
          (item: any) => new Date(item.timestamp) >= monthAgo
        );

        // Only fall back to daily if we have less than 2 data points total
        if (filteredData.length < 2) {
          processedData = filteredData.map((item: any) => ({
            label: new Date(item.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: item.amount,
            originalTimestamp: item.timestamp,
            aggregatedFrom: 1,
          }));
          break;
        }

        // Always try to group by week for 1M view
        const weeklyData: {
          [key: string]: {
            lastValue: number;
            lastTimestamp: string;
            items: any[];
          };
        } = {};

        filteredData.forEach((item: any) => {
          const date = new Date(item.timestamp);
          const weekStart = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() - date.getDay()
          );
          const weekKey = weekStart.toISOString().split("T")[0];

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              lastValue: item.amount,
              lastTimestamp: item.timestamp,
              items: [],
            };
          }

          // Keep the latest (last) value for this week
          if (
            new Date(item.timestamp) >=
            new Date(weeklyData[weekKey].lastTimestamp)
          ) {
            weeklyData[weekKey].lastValue = item.amount;
            weeklyData[weekKey].lastTimestamp = item.timestamp;
          }
          weeklyData[weekKey].items.push(item);
        });

        const result = Object.entries(weeklyData)
          .map(([_, data]) => ({
            label: `Week of ${new Date(data.lastTimestamp).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            )}`,
            value: data.lastValue,
            originalTimestamp: data.lastTimestamp,
            aggregatedFrom: data.items.length,
          }))
          .sort(
            (a, b) =>
              new Date(a.originalTimestamp).getTime() -
              new Date(b.originalTimestamp).getTime()
          );

        // If we only get 1 week, create a trend by showing start and end of that week
        if (result.length === 1 && filteredData.length > 1) {
          const firstDataPoint = filteredData[0];
          const lastDataPoint = filteredData[filteredData.length - 1];

          processedData = [
            {
              label: new Date(firstDataPoint.timestamp).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              ),
              value: firstDataPoint.amount,
              originalTimestamp: firstDataPoint.timestamp,
              aggregatedFrom: 1,
            },
            {
              label: new Date(lastDataPoint.timestamp).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              ),
              value: lastDataPoint.amount,
              originalTimestamp: lastDataPoint.timestamp,
              aggregatedFrom: 1,
            },
          ];
        } else {
          processedData = result;
        }
        break;
      }

      case "1y": {
        // Last 12 months, group by month
        const yearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        const filteredData = rawData.filter(
          (item: any) => new Date(item.timestamp) >= yearAgo
        );

        // If we have less than 2 months of data, create artificial monthly points or use daily
        if (filteredData.length === 0) {
          processedData = [];
          break;
        }

        // Group by month and use last value
        const monthlyData: {
          [key: string]: {
            lastValue: number;
            lastTimestamp: string;
            items: any[];
          };
        } = {};

        filteredData.forEach((item: any) => {
          const date = new Date(item.timestamp);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              lastValue: item.amount,
              lastTimestamp: item.timestamp,
              items: [],
            };
          }

          // Keep the latest (last) value for this month
          if (
            new Date(item.timestamp) >=
            new Date(monthlyData[monthKey].lastTimestamp)
          ) {
            monthlyData[monthKey].lastValue = item.amount;
            monthlyData[monthKey].lastTimestamp = item.timestamp;
          }
          monthlyData[monthKey].items.push(item);
        });

        let result = Object.entries(monthlyData)
          .map(([_, data]) => ({
            label: new Date(data.lastTimestamp).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            value: data.lastValue,
            originalTimestamp: data.lastTimestamp,
            aggregatedFrom: data.items.length,
          }))
          .sort(
            (a, b) =>
              new Date(a.originalTimestamp).getTime() -
              new Date(b.originalTimestamp).getTime()
          );

        // If only one month, create a trend line by duplicating with slight variation
        if (result.length === 1 && filteredData.length > 1) {
          const singleMonth = result[0];
          const firstDataPoint = filteredData[0];
          const lastDataPoint = filteredData[filteredData.length - 1];

          // Create start and end points for the month to show trend
          result = [
            {
              label: new Date(firstDataPoint.timestamp).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              ),
              value: firstDataPoint.amount,
              originalTimestamp: firstDataPoint.timestamp,
              aggregatedFrom: 1,
            },
            {
              label: new Date(lastDataPoint.timestamp).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              ),
              value: lastDataPoint.amount,
              originalTimestamp: lastDataPoint.timestamp,
              aggregatedFrom: 1,
            },
          ];
        }

        processedData = result;
        break;
      }

      default:
        processedData = [];
    }

    // Ensure we always have at least 2 points to create a line (avoid single dots)
    if (processedData.length === 1) {
      const singlePoint = processedData[0];
      const pointDate = new Date(singlePoint.originalTimestamp);

      // Create a second point with same value but earlier timestamp to show horizontal line
      const earlierDate = new Date(pointDate.getTime() - 24 * 60 * 60 * 1000); // 1 day earlier

      processedData = [
        {
          label: earlierDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: singlePoint.value,
          originalTimestamp: earlierDate.toISOString(),
          aggregatedFrom: 1,
        },
        singlePoint,
      ];
    }

    return processedData;
  }, [assetHistory, selectedTimeframe]);

  // Calculate percentage increase for selected timeframe
  const percentIncrease = React.useMemo(() => {
    if (chartData.length < 2) return "0.00";
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return first > 0 ? (((last - first) / first) * 100).toFixed(2) : "0.00";
  }, [chartData]);

  // Calculate today's percentage change
  const todayPercentChange = React.useMemo(() => {
    if (!assetHistory?.data || assetHistory.data.length < 2) return "0.00";

    const today = new Date().toDateString();
    const sortedData = [...assetHistory.data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get today's latest value
    const todayData = sortedData.filter(
      (item) => new Date(item.timestamp).toDateString() === today
    );
    const latestValue = sortedData[sortedData.length - 1].amount; // Most recent value

    // Get yesterday's latest value (or previous available day)
    let previousValue = null;
    for (let i = sortedData.length - 2; i >= 0; i--) {
      const itemDate = new Date(sortedData[i].timestamp).toDateString();
      if (itemDate !== today) {
        previousValue = sortedData[i].amount;
        break;
      }
    }

    if (previousValue === null || previousValue === 0) return "0.00";

    const change = ((latestValue - previousValue) / previousValue) * 100;
    return change.toFixed(2);
  }, [assetHistory]);

  // Helper functions for color coding
  const getPercentageColor = (percentage: string) => {
    const num = parseFloat(percentage);
    if (num > 0) return "text-green-600";
    if (num < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getPercentageIcon = (percentage: string) => {
    const num = parseFloat(percentage);
    if (num > 0) return <FiArrowUpRight className="mr-1" />;
    if (num < 0) return <FiArrowDownRight className="mr-1" />;
    return null;
  };

  // Mock yield data - in production this would come from the API
  const totalYield = 0;

  // Function to format number with fixed 3 decimal places for consistency
  const formatBalance = (value: number) => {
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    const digitsOnly = formatted.replace(/[^0-9]/g, "");
    if (digitsOnly.length > 6) {
      // If more than 6 digits, truncate and add K/M/B suffix
      const num = value;
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(3) + "B";
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(3) + "M";
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(3) + "K";
      }
    }
    return formatted;
  };

  // Function to calculate font size based on balance length
  const calculateFontSize = (value: number) => {
    const length = value.toString().replace(/[^0-9]/g, "").length;
    if (length > 6) return "text-3xl";
    if (length > 4) return "text-4xl";
    return "text-5xl";
  };

  const balance = isLoading ? 0 : totalAssets;
  const formattedBalance = formatBalance(balance);
  const balanceFontSize = calculateFontSize(balance);

  // Combine loading states
  const isChartLoading = isLoading || historyLoading;
  const hasChartData = chartData.length > 0;

  return (
    <>
      <div
        className="p-1 mb-1 flex flex-col bg-white transition-all duration-500 border-gray-200"
        style={{ minHeight: expanded ? 320 : 120 }}
      >
        <div
          className="flex items-center justify-between relative"
          style={{ minHeight: 120 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground font-medium">
                Total Assets
              </span>
              <button
                type="button"
                onClick={() => setHideBalance((prev) => !prev)}
                className="focus:outline-none"
                aria-label={hideBalance ? "Show balance" : "Hide balance"}
              >
                {hideBalance ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl text-black font-semibold">$</span>
              {isLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <span className={`${balanceFontSize} font-semibold text-black`}>
                  {hideBalance ? "******" : formattedBalance}
                </span>
              )}
            </div>
            {/* Yield information */}
            <div className="flex items-center gap-4 mt-2">
              {isLoading ? (
                <Skeleton className="h-5 w-28" />
              ) : (
                <>
                  {/* Today's percentage change */}
                  <div
                    className={`flex gap-1 items-center text-sm font-medium ${getPercentageColor(
                      todayPercentChange
                    )}`}
                  >
                    {getPercentageIcon(todayPercentChange)}
                    <span>
                      {parseFloat(todayPercentChange) >= 0 ? "+" : ""}
                      {todayPercentChange}%
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      (Today)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Tiny line chart and expand icon, only show if not expanded */}
          {!expanded && (
            <div className="flex-1 flex justify-end items-end relative">
              {isChartLoading ? (
                <Skeleton className="w-32 h-16 rounded-md" />
              ) : hasChartData ? (
                <div
                  className="w-32 h-16 cursor-pointer"
                  onClick={() => setExpanded(true)}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#111"
                        strokeWidth={3}
                        dot={false}
                      />
                      <YAxis domain={["dataMin", "dataMax"]} hide={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-32 h-16 flex items-center justify-center text-gray-400 text-xs">
                  No data
                </div>
              )}
              {/* Expand Button */}
              <button
                className="absolute right-0 rounded-full p-1 transition mt-8"
                style={{ zIndex: 2, bottom: "-12px" }}
                onClick={() => setExpanded(true)}
                aria-label="Expand chart"
                disabled={isChartLoading}
              >
                <FiMaximize2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {/* Expanded large chart, within the card and divider */}
        <div
          className={`transition-all duration-500 overflow-hidden flex flex-col items-center`}
          style={{
            maxHeight: expanded ? 320 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          {expanded && (
            <>
              {/* Percentage increase */}
              <div className="w-full flex justify-end items-center mb-2 mt-2 px-2">
                {isChartLoading ? (
                  <Skeleton className="h-5 w-16 ml-auto" />
                ) : hasChartData ? (
                  <div
                    className={`text-sm font-regular ${getPercentageColor(
                      percentIncrease
                    )} flex items-center`}
                  >
                    {getPercentageIcon(percentIncrease)}
                    {percentIncrease}%
                  </div>
                ) : (
                  <div className="text-sm font-regular text-gray-400 flex items-center">
                    No data available
                  </div>
                )}
              </div>
              {/* Large chart */}
              <div className="w-full">
                {isChartLoading ? (
                  <Skeleton className="h-[140px] w-full rounded-md" />
                ) : hasChartData ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart
                      data={chartData}
                      onMouseMove={(data) => {
                        if (data && data.activePayload) {
                          setHoveredData(data);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredData(null);
                      }}
                    >
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#111"
                        strokeWidth={4}
                        dot={false}
                      />
                      <YAxis domain={["dataMin", "dataMax"]} hide={true} />
                      <Tooltip
                        content={({ active, payload }) => {
                          return active && payload && payload.length ? (
                            <div className="bg-white p-3 rounded-lg shadow border text-xs min-w-[140px]">
                              <div className="font-semibold mb-2">
                                {new Date(
                                  payload[0].payload.originalTimestamp
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Balance: </span>
                                <span className="text-black font-semibold">
                                  {hideBalance
                                    ? "******"
                                    : `$${payload[0].value?.toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 3,
                                          maximumFractionDigits: 3,
                                        }
                                      )}`}
                                </span>
                              </div>
                            </div>
                          ) : null;
                        }}
                        cursor={{ fill: "#f3f4f6" }}
                        isAnimationActive={false}
                        trigger="click"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[140px] w-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-sm">No chart data available</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Timeframe selector below the chart */}
              <div className="flex items-center justify-center gap-2 mt-2 mb-2 w-full">
                {isChartLoading ? (
                  <div className="flex gap-2 justify-center w-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-14 rounded-full" />
                    ))}
                  </div>
                ) : (
                  timeframes.map((tf) => (
                    <button
                      key={tf}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTimeframe === tf
                          ? "bg-gray-100 text-black"
                          : "text-gray-400"
                      }`}
                      onClick={() => {
                        setSelectedTimeframe(tf);
                      }}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))
                )}
              </div>
              {/* Collapse (^) icon below the chart and timeframe */}
              <button
                className="mx-auto bg-white rounded-full shadow p-1 hover:bg-gray-100 transition mb-2"
                style={{ zIndex: 2 }}
                onClick={() => {
                  setExpanded(false);
                }}
                aria-label="Collapse chart"
                disabled={isChartLoading}
              >
                <FiChevronUp className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TotalAssets;
