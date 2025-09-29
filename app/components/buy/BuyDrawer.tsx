import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import { Plus, Coins } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface BuyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyClick: () => void;
}

const BuyDrawer: React.FC<BuyDrawerProps> = ({ open, onOpenChange }) => {
  const router = useRouter();

  const handleBuy = () => {
    onOpenChange(false); // Close the drawer first
    setTimeout(() => {
      router.push("/on-ramp");
    }, 100); // Small delay to ensure drawer closes before navigation
  };

  const handleDeposit = () => {
    onOpenChange(false); // Close the drawer first
    setTimeout(() => {
      router.push("/receive/select-token");
    }, 100); // Small delay to ensure drawer closes before navigation
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <DrawerTitle className="sr-only">
          Buy, Sell, or Convert Crypto
        </DrawerTitle>
        <div className="pt-4 pb-2" />
        <div className="divide-y divide-gray-100">
          {/* Deposit Option */}
          <button
            onClick={handleDeposit}
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
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
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
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

          {/* Sell Option */}
          {/* <button
            onClick={() => router.push("/buy")}
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <Minus className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">Sell</div>
              <div className="text-gray-500 text-sm">Sell crypto for cash</div>
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
          </button> */}
          {/* Convert Option */}
          {/* <button className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group">
            <span className="text-2xl mr-4 text-black font-bold">
              <Repeat2 className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">Convert</div>
              <div className="text-gray-500 text-sm">
                Convert one crypto to another
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
          </button> */}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BuyDrawer;
