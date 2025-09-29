import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getVaultConfig } from "@/app/lib/config/vaults";

interface VaultRowProps {
  id: string;
  name: string;
  risk: "Low" | "Medium" | "High";
  apy: number;
  stakedAmount: number;
  totalYield: number;
  avatarUrl?: string;
  active?: boolean;
  isIntegratedProfit?: boolean; // New prop to indicate if profits are from real data
}

// Function to format number with dynamic decimal places
const formatAmount = (value: number, maxDecimalPlaces: number = 3, forceDecimalPlaces?: number) => {
  // If forceDecimalPlaces is specified, use that
  let decimalPlaces = forceDecimalPlaces;
  
  if (decimalPlaces === undefined) {
    // Determine optimal decimal places (2 if third decimal is 0, otherwise 3)
    const getOptimalDecimalPlaces = (num: number, max: number = 3) => {
      if (max < 3) return max; // If max is less than 3, use max

      // Check if the third decimal place is effectively 0
      const rounded3 = Number(num.toFixed(3));
      const rounded2 = Number(num.toFixed(2));

      // If rounding to 2 decimals gives the same result as 3 decimals, use 2
      return Math.abs(rounded3 - rounded2) < 0.001 ? 2 : 3;
    };

    decimalPlaces = getOptimalDecimalPlaces(value, maxDecimalPlaces);
  }

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  const digitsOnly = formatted.replace(/[^0-9]/g, "");
  if (digitsOnly.length > 6) {
    // If more than 6 digits, truncate and add K/M/B suffix
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(decimalPlaces) + "B";
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(decimalPlaces) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(decimalPlaces) + "K";
    }
  }
  return formatted;
};

const VaultRow: React.FC<VaultRowProps> = ({
  id,
  name,
  risk,
  apy,
  stakedAmount,
  totalYield,
  active = true, // Default to true for backward compatibility
  isIntegratedProfit = false, // Default to false for backward compatibility
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (active) {
      router.push(`/vault/${id}`);
    }
  };

  // Use dynamic decimal places for both position and profits
  // const profitDecimalPlaces = isIntegratedProfit ? 3 : 2;

  return (
    <Card
      className={`active-card card-tap-effect ${
        active ? "cursor-pointer" : "cursor-not-allowed opacity-60"
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0 active-card-content">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2 py-2">
          <div className="flex items-center gap-3">
            <div>
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={
                    getVaultConfig(id)?.avatarUrl || `/${id.toLowerCase()}.png`
                  }
                  alt={name}
                />
                <AvatarFallback
                  className={active ? "" : "bg-gray-300 text-gray-500"}
                >
                  {name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <div
                className={`font-regular text-base leading-tight ${
                  active ? "text-black" : "text-gray-400"
                }`}
              >
                {name}
                {!active && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <div
                className={`text-xs ${
                  active ? "text-muted-foreground" : "text-gray-400"
                }`}
              >
                {risk} risk
              </div>
            </div>
          </div>
          <div className="pe-2">
            <ChevronRight
              className={`w-6 h-6 ${
                active ? "text-gray-400" : "text-gray-300"
              }`}
            />
          </div>
        </div>
        {/* Divider */}
        <div className="w-full h-px bg-gray-200 my-2" />
        {/* Bottom row */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <span
              className={`text-xs ${
                active ? "text-muted-foreground" : "text-gray-400"
              }`}
            >
              Your Position
            </span>
            <span
              className={`text-lg font-regular ${
                active ? "text-black" : "text-gray-400"
              }`}
            >
              {active ? `$${formatAmount(stakedAmount)}` : "--"}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span
              className={`text-xs ${
                active ? "text-muted-foreground" : "text-gray-400"
              }`}
            >
              APY
            </span>
            <span
              className={`font-regular text-lg ${
                active ? "text-green-600" : "text-gray-400"
              }`}
            >
              {active ? `${apy}%` : "--"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`text-xs ${
                active ? "text-muted-foreground" : "text-gray-400"
              }`}
            >
              Profits
            </span>
            <span
              className={`text-lg font-regular ${
                active ? "text-green-600" : "text-gray-400"
              }`}
            >
              {active ? `$${formatAmount(totalYield, 3, 3)}` : "--"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VaultRow;
