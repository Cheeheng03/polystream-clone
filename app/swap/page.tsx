'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import SwapInterface from '../components/swap/SwapInterface';
import { useMultiChainSmartWallet } from '../lib/hooks';
import { motion } from 'framer-motion';

export default function SwapPage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const { data: walletData, isLoading } = useMultiChainSmartWallet();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/sign-in');
    }
  }, [ready, authenticated, router]);

  // Show loading while checking authentication
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!authenticated || !walletData) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main content */}
        <div className="flex justify-center">
          <SwapInterface defaultChain="scroll" />
        </div>
    </motion.div>
  );
}