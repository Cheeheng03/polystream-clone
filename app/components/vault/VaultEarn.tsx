import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  LabelList,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface VaultEarnProps {
  chartData: any[];
  timeframe: string;
  setTimeframe: (value: string) => void;
}

const VaultEarn: React.FC<VaultEarnProps> = ({
  chartData,
  timeframe,
  setTimeframe,
}) => {
  return (
    <>
      <div className="w-full flex justify-center">
        <div className="bg-white rounded-xl py-3 w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 8, left: 8, bottom: 8 }}
              barCategoryGap={12}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888" }}
              />
              <Tooltip
                content={({ active, payload }: TooltipProps<number, string>) =>
                  active && payload && payload.length ? (
                    <div className="bg-white p-2 rounded-lg shadow border text-xs min-w-[110px]">
                      <div className="font-semibold mb-1">
                        {payload[0].payload.date}
                      </div>
                      <div>
                        <span className="text-gray-500">Profits: </span>
                        <span className="text-green-600 font-semibold">
                          ${payload[0].payload.yield}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">APY: </span>
                        <span className="text-blue-600 font-semibold">
                          {payload[0].payload.apy}%
                        </span>
                      </div>
                    </div>
                  ) : null
                }
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar
                dataKey="yield"
                fill="url(#yieldGradient)"
                radius={[6, 6, 0, 0]}
                barSize={18}
              >
                <LabelList
                  position="top"
                  offset={12}
                  fill="#22c55e"
                  fontSize={12}
                  fontWeight={500}
                  formatter={(value: number) => `$${value}`}
                />
              </Bar>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#bbf7d0" stopOpacity={0.7} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Tabs value={timeframe} onValueChange={setTimeframe}>
        <TabsList className="w-full flex justify-center gap-2 bg-gray-100 shadow-none">
          <TabsTrigger
            value="7d"
            className="px-3 py-1 rounded-full text-sm font-medium"
          >
            7d
          </TabsTrigger>
          <TabsTrigger
            value="1m"
            className="px-3 py-1 rounded-full text-sm font-medium"
          >
            1m
          </TabsTrigger>
          <TabsTrigger
            value="3m"
            className="px-3 py-1 rounded-full text-sm font-medium"
          >
            3m
          </TabsTrigger>
          <TabsTrigger
            value="1y"
            className="px-3 py-1 rounded-full text-sm font-medium"
          >
            1y
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};

export default VaultEarn;
