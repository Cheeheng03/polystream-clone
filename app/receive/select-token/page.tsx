"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { getAllTokens, TokenConfig } from "@/app/lib/config/select-token";

const tokens = getAllTokens();

// Helper function, not exported at the page level
function getEnabledTokens(): TokenConfig[] {
  return getAllTokens().filter(token => token.enabled);
}

export default function SelectTokenPage() {
  const router = useRouter();
  const params = useSearchParams();
  const isFromBack = params?.get("from") === "back";

  return (
    <AnimatePresence>
      <motion.div
        className="h-[90vh] bg-white flex flex-col"
        initial={isFromBack ? { x: 0 } : { x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center px-4 pt-4 pb-2">
          <button
            className="mr-2 p-2 rounded-full hover:bg-gray-100"
            onClick={() => router.push("/portfolio")}
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        </div>
        <div className="px-6 pb-2">
          <h1 className="text-3xl font-bold mb-1">Receive</h1>
          <p className="text-gray-400 text-base mb-4">
            Select the token you want to receive to your wallet
          </p>
        </div>
        <div className="flex flex-col gap-3 px-3 pb-4">
          {tokens.map((token) => (
            <button
              key={token.symbol}
              className="flex items-center w-full border rounded-2xl px-4 py-4 transition disabled:opacity-50 card-tap-effect"
              onClick={() =>
                router.push(`/receive/select-network?token=${token.symbol}`)
              }
              disabled={!token.enabled}
            >
              <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mr-4 overflow-hidden">
                <Avatar>
                  <AvatarImage src={token.icon} />
                  <AvatarFallback>{token.symbol}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-black text-base">
                  {token.name} 
                </div>
                <div className="text-gray-400 text-xs">{!token.enabled && "Coming Soon"}{token.symbol}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
