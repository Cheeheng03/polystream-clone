import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import Image from "next/image";
import { SupportedChainKey } from "../../lib/config/chains";

interface ChainSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  CHAIN_CONFIG: Record<
    SupportedChainKey,
    { name: string; icon: string; available: boolean }
  >;
  selectedChain: SupportedChainKey;
  setSelectedChain: (chain: SupportedChainKey) => void;
}

const ChainSelectDrawer: React.FC<ChainSelectDrawerProps> = ({
  open,
  onOpenChange,
  CHAIN_CONFIG,
  selectedChain,
  setSelectedChain,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">
            Select Network
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-2">
          {Object.entries(CHAIN_CONFIG)
            .filter(([chainKey]) => chainKey !== "scrollSepolia") // Hide testnet
            .map(([chainKey, config]) => (
              <button
                key={chainKey}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  selectedChain === chainKey
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
                onClick={() => {
                  setSelectedChain(chainKey as SupportedChainKey);
                  onOpenChange(false);
                }}
                disabled={!config.available}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={config.icon}
                      alt={config.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-medium ${
                        config.available ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {config.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {config.available ? "Available" : "Register Code"}
                    </div>
                  </div>
                </div>
                {config.available && <span className="text-green-600">✓</span>}
              </button>
            ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChainSelectDrawer;
