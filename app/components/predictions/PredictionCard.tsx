"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Bookmark } from "lucide-react";

interface Outcome {
  name: string;
  probability: number;
  color: "green" | "red";
}

interface PredictionMarket {
  id: string;
  title: string;
  chance?: number;
  type: "binary" | "multiple";
  volume: string;
  icon: string;
  outcomes: Outcome[];
}

interface PredictionCardProps {
  market: PredictionMarket;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ market }) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const router = useRouter();

  const handleOutcomeClick = (outcomeName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent container click
    const outcome = outcomeName.toLowerCase();
    router.push(`/predictions/${market.id}?outcome=${outcome}`);
  };

  const handleContainerClick = () => {
    router.push(`/predictions/${market.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            {market.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {market.title}
            </h3>
            {market.chance && (
              <div className="text-xs text-muted-foreground mt-1">
                {market.chance}% chance
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Gift className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Outcomes */}
      <div className="space-y-2 mb-4">
        {market.outcomes.map((outcome, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  {outcome.name}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {outcome.probability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    outcome.color === "green" ? "bg-green-400" : "bg-red-400"
                  }`}
                  style={{ width: `${outcome.probability}%` }}
                ></div>
              </div>
            </div>
            <div className="flex space-x-1 ml-3">
              <button
                onClick={(e) => handleOutcomeClick('yes', e)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedOutcome === `${outcome.name}-yes`
                    ? "bg-green-400 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                Yes
              </button>
              <button
                onClick={(e) => handleOutcomeClick('no', e)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedOutcome === `${outcome.name}-no`
                    ? "bg-red-400 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-muted-foreground">
          ${market.volume} Vol.
        </div>
        <div className="text-xs text-muted-foreground">
          {market.type === "binary" ? "Binary Market" : "Multi-Outcome"}
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
