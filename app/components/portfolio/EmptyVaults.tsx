import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function EmptyVaults() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-foreground mb-2">
          No Active Strategies
        </h2>
        <p className="text-muted-foreground">
          Start earning yields by investing in our strategies
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-black text-white px-6 py-3 rounded-full font-medium"
        onClick={() => router.push("/market")}
      >
        Explore Strategies
      </motion.button>
    </div>
  );
}