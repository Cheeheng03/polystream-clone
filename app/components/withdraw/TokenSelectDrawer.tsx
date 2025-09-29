import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import Image from "next/image";
import { getEnabledTokens } from "@/app/lib/config/select-token";

interface TokenSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: ReturnType<typeof getEnabledTokens>[0];
  onTokenSelect: (token: ReturnType<typeof getEnabledTokens>[0]) => void;
  getTotalBalanceForToken: (tokenSymbol: string) => string;
}

const TokenSelectDrawer: React.FC<TokenSelectDrawerProps> = ({
  open,
  onOpenChange,
  selectedToken,
  onTokenSelect,
  getTotalBalanceForToken,
}) => {
  // Only get enabled tokens
  const TOKENS = getEnabledTokens();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-lg text-start font-semibold">
            Available Tokens
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {TOKENS.map((token) => {
            const tokenBalance = getTotalBalanceForToken(token.symbol);
            const hasBalance = parseFloat(tokenBalance) > 0;

            return (
              <button
                key={token.symbol}
                className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                  selectedToken.symbol === token.symbol ? "bg-gray-50" : ""
                }`}
                onClick={() => onTokenSelect(token)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mr-4 overflow-hidden">
                    <Image
                      src={token.icon}
                      alt={token.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-black">{token.name}</span>
                    <span className="text-sm text-gray-500">
                      {token.symbol}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`font-medium ${
                      hasBalance ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {tokenBalance} {token.symbol}
                  </span>
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
