import React, { useState } from "react";
import { PieChart, Pie, Sector, ResponsiveContainer } from "recharts";
import { Vault } from "../../data/vaults";
import { Skeleton } from "../ui/skeleton";

interface VaultStrategyProps {
  vault: Vault;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  COLORS: string[];
  protocolAllocations?: { name: string; value: number; percent: number }[];
  protocolLoading?: boolean;
}

const VaultStrategy: React.FC<VaultStrategyProps> = ({
  vault,
  activeIndex,
  setActiveIndex,
  COLORS,
  protocolAllocations,
  protocolLoading,
}) => {
  // Pie chart data: use protocolAllocations if available, else fallback to vault.pools
  const pieData =
    protocolAllocations && protocolAllocations.length > 0
      ? protocolAllocations.map((p, idx) => ({
          name: p.name,
          value: p.value,
          percent: p.percent,
          fill: COLORS[idx % COLORS.length],
        }))
      : vault.pools.map((pool, idx) => ({
          name: pool.name,
          value: pool.apy,
          percent: 0,
          fill: COLORS[idx % COLORS.length],
        }));

  // Helper to format percentage and balance
  const formatPercent = (percent: number) => `${percent.toFixed(2)}%`;
  const formatBalance = (value: number) => `$${value.toFixed(2)}`;

  // Update renderActiveShape to show both percentage and actual balance
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    return (
      <g>
        {/* Vault Name */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fill={fill}
          fontSize={22}
          fontWeight={700}
          dy={-8}
        >
          {payload.name}
        </text>
        {/* Allocation */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fill="#999"
          fontSize={12}
          fontWeight={400}
          dy={15}
        >
          {`Allocation: ${formatPercent(payload.percent)} | ${formatBalance(
            payload.value
          )}`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={12}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          cornerRadius={12}
        />
      </g>
    );
  };

  if (protocolLoading) {
    return (
      <div className="relative h-[400px] mb-40">
        {/* Pie chart skeleton */}
        <div className="flex items-center justify-center h-[400px]">
          <div className="relative">
            {/* Outer ring skeleton */}
            <Skeleton className="w-80 h-80 rounded-full bg-gray-200" animate={true} />
            {/* Inner ring skeleton */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Skeleton className="w-60 h-60 rounded-full bg-white" animate={false} />
            </div>
            {/* Center content skeleton */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <Skeleton className="h-6 w-24 mb-2 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] mb-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            innerRadius={120}
            outerRadius={160}
            fill="#F3F4F6"
            stroke="none"
            dataKey="value"
            isAnimationActive={false}
            cornerRadius={24}
            paddingAngle={0}
          />
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={120}
            outerRadius={160}
            cornerRadius={12}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onClick={(_, index) => setActiveIndex(index)}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {vault.pools.map((pool, index) => (
          <div key={pool.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-600">{pool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VaultStrategy;
