import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import Image from "next/image";

interface TokenSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supportedTokens: string[];
  tokenPrices: { [key: string]: number };
  TOKEN_CONFIG: any;
  selectingInput: boolean;
  inputToken: string;
  outputToken: string;
  handleTokenSelect: (token: string) => void;
}

const TokenSelectDrawer: React.FC<TokenSelectDrawerProps> = ({
  open,
  onOpenChange,
  supportedTokens,
  tokenPrices,
  TOKEN_CONFIG,
  selectingInput,
  inputToken,
  outputToken,
  handleTokenSelect,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">
            Select {selectingInput ? "Input" : "Output"} Token
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-2">
          {supportedTokens.map((token) => {
            const config = TOKEN_CONFIG[token as keyof typeof TOKEN_CONFIG];
            const price = tokenPrices[config.priceKey];
            return (
              <button
                key={token}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  (selectingInput ? inputToken : outputToken) === token
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
                onClick={() => handleTokenSelect(token)}
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
                    <div className="font-medium text-gray-900">
                      {config.name}
                    </div>
                    <div className="text-sm text-gray-500">{config.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {price
                      ? `$${price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "$0.00"}
                  </div>
                  <div className="text-sm text-gray-500">Price</div>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TokenSelectDrawer;
