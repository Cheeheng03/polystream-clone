import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Vault } from "../../data/vaults";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import VaultBuyDrawer from "./VaultBuyDrawer";
import VaultWithdrawDrawer from "./VaultWithdrawDrawer";
import VaultStats from "./VaultStats";
import VaultEarn from "./VaultEarn";
import VaultStrategy from "./VaultStrategy";
import VaultDetails from "./VaultDetails";
import { getVaultConfig } from "@/app/lib/config/vaults";
import { useVaultProtocolBalances } from "@/app/lib/hooks";

// Add custom animation class
const styles = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.2; }
    100% { opacity: 1; }
  }
  .blink-dot {
    animation: blink 1s ease-in-out infinite;
  }
`;

interface VaultDetailsProps {
  vault: Vault;
  stakedAmount: number;
  totalYield: number;
  yesterdayYield: number;
  onDrawerOpenChange?: (open: boolean) => void;
}

// Place this before the return statement in the component
const tinyBarData = [
  { date: "Mon", yield: 10, apy: 0.5 },
  { date: "Tue", yield: 12, apy: 0.6 },
  { date: "Wed", yield: 15, apy: 0.7 },
  { date: "Thu", yield: 13, apy: 0.65 },
  { date: "Fri", yield: 18, apy: 0.8 },
  { date: "Sat", yield: 20, apy: 0.9 },
  { date: "Sun", yield: 22, apy: 1.0 },
];

const VaultDetailsComponent: React.FC<VaultDetailsProps> = ({
  vault,
  stakedAmount,
  totalYield,
  yesterdayYield,
  onDrawerOpenChange,
}) => {
  const router = useRouter();
  const [buyDrawerOpen, setBuyDrawerOpen] = useState(false);
  const [withdrawDrawerOpen, setWithdrawDrawerOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("7d");
  const [activeIndex, setActiveIndex] = useState(0);

  const vaultConfig = getVaultConfig(vault.id);
  const { data: protocolBalances, isLoading: protocolLoading } =
    useVaultProtocolBalances(vaultConfig);

  // Calculate protocol allocation percentages
  let protocolAllocations: { name: string; value: number; percent: number }[] =
    [];
  if (protocolBalances) {
    const total = Object.values(protocolBalances).reduce((a, b) => a + b, 0);
    protocolAllocations = Object.entries(protocolBalances).map(
      ([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
      })
    );
  }

  // Notify parent when any drawer state changes
  useEffect(() => {
    onDrawerOpenChange?.(buyDrawerOpen || withdrawDrawerOpen);
  }, [buyDrawerOpen, withdrawDrawerOpen, onDrawerOpenChange]);

  // Add color palette for pie chart (Green family)
  const COLORS = ["#AFDC8F", "#87BB62", "#63993D", "#3D7317", "#204D00"];

  const chartDataMap = {
    "7d": tinyBarData,
    "1m": [
      /* ...data for 1 month... */
    ],
    "3m": [
      /* ...data for 3 months... */
    ],
    "1y": [
      /* ...data for 1 year... */
    ],
  };

  const chartData = chartDataMap[timeframe as keyof typeof chartDataMap];

  // Determine token based on vault
  const getVaultToken = () => {
    if (vault.id.includes("eth")) return "ETH";
    if (vault.id.includes("btc")) return "BTC";
    return "USDC";
  };

  const token = getVaultToken();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{styles}</style>
      {/* Header */}
      <div className="sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 bg-gray-200">
              <AvatarImage
                src={
                  getVaultConfig(vault.id)?.avatarUrl ||
                  `/${vault.id.toLowerCase()}.png`
                }
                alt={vault.name}
              />
              <AvatarFallback className="text-sm font-medium">
                {vault.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xl text-black font-medium">{vault.name}</span>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Your Position - Main Section */}
        <div className="px-6 pb-3">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-base text-gray-500 mb-2">Your Position</div>
              <div className="text-4xl font-semibold text-black">
                ${stakedAmount.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base text-gray-500 mb-2">APY</div>
              <div className="text-4xl font-semibold text-green-600">
                {vault.apy.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Total Asset - Smaller Section */}
        <div className="px-6 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Assets Under Management (AUM)
              </div>
              <div className="text-xl font-semibold text-black">
                $
                {vault.deposits >= 1000000
                  ? `${(vault.deposits / 1000000).toFixed(2)}M`
                  : `${vault.deposits.toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-0 space-y-4">
        <Tabs defaultValue="strategy" className="w-full mt-4 px-4">
          <TabsList className="w-full flex justify-between">
            <TabsTrigger value="strategy" className="flex-1 rounded-2xl">
              Strategy
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1 rounded-2xl">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategy">
            <VaultStrategy
              vault={vault}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              COLORS={COLORS}
              protocolAllocations={protocolAllocations}
              protocolLoading={protocolLoading}
            />
          </TabsContent>

          <TabsContent value="details" className="pb-16">
            <VaultDetails vault={vault} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white">
        <div className="flex gap-3">
          <button
            className="flex-1 bg-black text-white py-3 px-4 rounded-3xl font-medium hover:bg-gray-800 transition-colors"
            onClick={() => setBuyDrawerOpen(true)}
          >
            Invest
          </button>
          <button
            className={`flex-1 bg-white text-black py-3 px-4 rounded-3xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors ${
              stakedAmount <= 0 ? "cursor-not-allowed" : ""
            }`}
            onClick={() => stakedAmount > 0 && setWithdrawDrawerOpen(true)}
            disabled={stakedAmount <= 0}
          >
            Redeem
          </button>
        </div>
      </div>

      {/* Buy Drawer */}
      <VaultBuyDrawer
        open={buyDrawerOpen}
        onOpenChange={setBuyDrawerOpen}
        vaultId={vault.id}
        vaultName={vault.name}
        vaultApy={vault.apy}
        token={token}
      />

      {/* Withdraw Drawer */}
      <VaultWithdrawDrawer
        open={withdrawDrawerOpen}
        onOpenChange={setWithdrawDrawerOpen}
        vaultId={vault.id}
        vaultName={vault.name}
        token={token}
      />
    </div>
  );
};

export default VaultDetailsComponent;
