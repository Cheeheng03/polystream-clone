import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import { Share, Repeat2 } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface TransferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferDrawer: React.FC<TransferDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();

  const handleWithdraw = () => {
    onOpenChange(false); // Close the drawer first
    setTimeout(() => {
      router.push("/withdraw");
    }, 100); // Small delay to ensure drawer closes before navigation
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <DrawerTitle className="sr-only">Send or Receive Crypto</DrawerTitle>
        <div className="pt-4 pb-2" />
        <div className="divide-y divide-gray-100">
          {/* Send Option */}
          <button
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
            onClick={handleWithdraw}
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <Share className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">Withdraw</div>
              <div className="text-gray-500 text-sm">To crypto address</div>
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
          {/* Convert Option */}
          <button
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
            onClick={() => router.push("/swap")}
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <Repeat2 className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">Convert</div>
              <div className="text-gray-500 text-sm">Swap your Crypto</div>
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
          {/* Receive Option */}
          {/* <button
            className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gray-50 transition group"
            onClick={() => router.push("/receive/select-token")}
          >
            <span className="text-2xl mr-4 text-black font-bold">
              <MoveDown className="w-6 h-6" />
            </span>
            <div className="flex-1 text-left">
              <div className="font-bold text-black text-base">
                Receive Crypto
              </div>
              <div className="text-gray-500 text-sm">
                From another crypto wallet
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

export default TransferDrawer;
