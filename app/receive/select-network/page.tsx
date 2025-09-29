"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getEnabledNetworksForToken, doesNetworkSupportToken } from "@/app/lib/config/select-network";
import { getTokenBySymbol } from "@/app/lib/config/select-token";

function NetworkSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params?.get("token") || "";

  // Get networks that support the selected token
  const availableNetworks = token ? getEnabledNetworksForToken(token) : [];
  const selectedToken = getTokenBySymbol(token);

  // If no token selected or invalid token, redirect to token selection
  if (!token || !selectedToken) {
    router.push('/receive/select-token');
    return null;
  }

  // If no networks support this token, show error message
  if (availableNetworks.length === 0) {
    return (
      <>
        <div className="flex flex-col px-4 pt-4 pb-2">
          <button
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            onClick={() => router.push(`/receive/select-token?from=back`)}
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        </div>
        <div className="px-6 pb-2">
          <h1 className="text-3xl font-bold mb-1">Network</h1>
          <p className="text-red-500 text-base mb-4">
            No networks support {selectedToken.symbol}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col px-4 pt-4 pb-2">
        <button
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          onClick={() => router.push(`/receive/select-token?from=back`)}
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>
      <div className="px-6 pb-2">
        <h1 className="text-3xl font-bold mb-1">Network</h1>
        <p className="text-gray-400 text-base mb-4">
          Select a network to receive {selectedToken.symbol}
        </p>
      </div>
      <div className="flex flex-col gap-3 px-3 pb-4">
        {availableNetworks.map((network) => {
          const isSupported = doesNetworkSupportToken(network.chainKey, token);
          
          return (
            <button
              key={network.name}
              className={`flex items-center w-full rounded-2xl px-4 py-4 border transition card-tap-effect ${
                network.enabled && isSupported
                  ? "hover:bg-gray-50"
                  : "opacity-60 cursor-not-allowed"
              }`}
              onClick={() =>
                network.enabled && isSupported &&
                router.push(
                  `/receive/address?token=${token}&network=${encodeURIComponent(
                    network.name
                  )}`
                )
              }
              disabled={!network.enabled || !isSupported}
            >
              <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mr-4 overflow-hidden">
                <Avatar>
                  <AvatarImage src={network.icon} />
                  <AvatarFallback>{network.name}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-black text-base">
                  {network.displayName}
                </div>
                {!network.enabled && (
                  <div className="text-gray-400 text-xs">Coming soon</div>
                )}
                {!isSupported && network.enabled && (
                  <div className="text-red-400 text-xs">
                    {selectedToken.symbol} not supported
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function SelectNetworkPage() {
  const params = useSearchParams();
  const isFromBack = params?.get("from") === "back";

  return (
    <AnimatePresence>
      <motion.div
        className="h-[80vh] bg-white flex flex-col"
        initial={isFromBack ? { x: 0 } : { x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Suspense
          fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
              <div className="animate-pulse">Loading network selection...</div>
            </div>
          }
        >
          <NetworkSelector />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
