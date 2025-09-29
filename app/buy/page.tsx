"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Coins, ArrowLeft } from "lucide-react";

export default function BuyPage() {
  const router = useRouter();

  const handleBuy = () => {
    router.push("/on-ramp");
  };

  const handleDeposit = () => {
    router.push("/receive/select-token");
  };

  return (
    <div className="bg-background flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center p-4 flex-shrink-0">
        <button className="mr-2 p-2 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold ml-2">Buy or Deposit</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Deposit Option */}
          <button
            onClick={handleDeposit}
            className="w-full flex items-center p-6 bg-card border border-border rounded-xl card-tap-effect transition-all duration-200 hover:shadow-sm group"
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <Coins className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">
                Deposit Crypto
              </div>
              <div className="text-gray-500 text-sm">
                Already have crypto? Deposit directly
              </div>
            </div>
            <span className="ml-2 text-gray-400 group-hover:text-black">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {/* Buy Option */}
          <button
            className="w-full flex items-center p-6 bg-card border border-border rounded-xl card-tap-effect transition-all duration-200 hover:shadow-sm group"
            onClick={handleBuy}
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <Plus className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">Buy</div>
              <div className="text-gray-500 text-sm">Buy crypto with cash</div>
            </div>
            <span className="ml-2 text-gray-400 group-hover:text-black">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
