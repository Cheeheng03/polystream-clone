"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactionByHash } from "../../lib/hooks";
import { TransactionsSkeleton } from "../../components/ui/skeletons";
import { useToast } from "../../components/ui/toast";
import { getVaultNameByAddress } from "../../lib/config/vaults";

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const hash = params?.hash as string;
  const { showToast } = useToast();
  
  const { data: transaction, isLoading, error } = useTransactionByHash(hash);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied to clipboard!`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getTransactionTitle = () => {
    if (!transaction) return 'Transaction';
    
    if (transaction.type === 'swap' && transaction.swapDetails) {
      return `Swap ${transaction.swapDetails.inputToken} → ${transaction.swapDetails.outputToken}`;
    }
    
    switch (transaction.type) {
      case 'accrue': return 'Yield Earned';
      case 'transfer-in': return 'Received';
      case 'transfer-out': return 'Sent';
      default: return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
    }
  };

  const getTransactionIcon = () => {
    if (!transaction) return null;
    
    if (transaction.type === 'swap') {
      return (
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    }
    
    const iconConfig = {
      'deposit': { bg: 'bg-gray-100', icon: '+', color: 'text-black' },
      'transfer-in': { bg: 'bg-green-100', icon: '+', color: 'text-green-500' },
      'accrue': { bg: 'bg-green-100', icon: '+', color: 'text-green-500' },
      'withdraw': { bg: 'bg-gray-100', icon: '-', color: 'text-black' },
      'transfer-out': { bg: 'bg-primary/20', icon: '-', color: 'text-primary' },
    };
    
    const config = iconConfig[transaction.type as keyof typeof iconConfig] || iconConfig['deposit'];
    
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bg}`}>
        <span className={`${config.color} text-xl font-bold`}>{config.icon}</span>
      </div>
    );
  };

  const getAmountDisplay = () => {
    if (!transaction) return '';
    
    if (transaction.type === 'swap' && transaction.swapDetails) {
      return `${transaction.swapDetails.outputAmount.toFixed(transaction.swapDetails.outputToken === 'ETH' ? 6 : 2)} ${transaction.swapDetails.outputToken}`;
    }
    
    const prefix = 
      transaction.type === 'transfer-out' ? '-' : 
      (transaction.type === 'transfer-in' || transaction.type === 'accrue') ? '+' : '';
      
    const decimals = 
      transaction.type === 'accrue' ? 6 : 
      transaction.token === 'ETH' ? 6 : 2;
      
    return `${prefix}${transaction.amount.toFixed(decimals)} ${transaction.token}`;
  };

  const getAmountColor = () => {
    if (!transaction) return 'text-black';
    
    if (transaction.type === 'swap') return 'text-primary';
    if (transaction.type === 'deposit') return 'text-black';
    if (transaction.type === 'transfer-in' || transaction.type === 'accrue') return 'text-green-500';
    if (transaction.type === 'withdraw' || transaction.type === 'transfer-out') return 'text-primary';
    
    return 'text-black';
  };

  const getVaultDisplayName = () => {
    if (!transaction) return 'Unknown';
    
    if (transaction.type === 'swap') {
      return 'Polystream Swap';
    }
    
    if (transaction.type === 'accrue' && transaction.fromAddress) {
      const vaultName = getVaultNameByAddress(transaction.fromAddress);
      return vaultName || transaction.vaultName || 'Unknown Vault';
    }
    
    return transaction.vaultName || 'Unknown';
  };

  if (isLoading) {
    return (
      <motion.main
        className="flex min-h-screen flex-col bg-background"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center px-6 pt-6">
          <button
            className="mr-4 p-2 rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Transaction Details</h1>
        </div>
        <div className="flex-1 px-6 py-6">
          <TransactionsSkeleton count={1} />
        </div>
      </motion.main>
    );
  }

  if (error || !transaction) {
    return (
      <motion.main
        className="flex min-h-screen flex-col bg-background"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center px-6 pt-6">
          <button
            className="mr-4 p-2 rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary">Transaction Details</h1>
        </div>
        <div className="flex-1 px-6 py-6">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-foreground mb-2">Transaction Not Found</h3>
            <p className="text-muted-foreground">The transaction could not be loaded or does not exist.</p>
          </div>
        </div>
      </motion.main>
    );
  }

  return (
    <AnimatePresence>
      <motion.main
        className="flex min-h-screen flex-col bg-background"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-6">
          <button
            className="mr-4 p-2 rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Transaction Details</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Transaction Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              {getTransactionIcon()}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {getTransactionTitle()}
                </h2>
                <p className="text-muted-foreground">
                  {getVaultDisplayName()}
                </p>
              </div>
            </div>
            
            <div className="text-center py-4 border-y border-border">
              <p className={`text-4xl font-bold ${getAmountColor()}`}>
                {getAmountDisplay()}
              </p>
              {transaction.chainId && (
                <p className="text-xs mt-2 text-muted-foreground">
                  On {
                    transaction.chainId === 534352 ? 'Scroll' :
                    transaction.chainId === 8453 ? 'Base' :
                    transaction.chainId === 10 ? 'Optimism' :
                    transaction.chainId === 42161 ? 'Arbitrum' :
                    transaction.chainId === 137 ? 'Polygon' :
                    'Unknown'
                  } Network
                </p>
              )}
            </div>
          </motion.div>

          {/* Swap Details Card (only for swap transactions) */}
          {transaction.type === 'swap' && transaction.swapDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Swap Details</h3>
              
              <div className="space-y-4">
                {/* Input Amount */}
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground font-medium">You Paid</span>
                  <span className="text-sm font-semibold text-foreground">
                    {transaction.swapDetails.inputAmount.toFixed(transaction.swapDetails.inputToken === 'ETH' ? 6 : 2)} {transaction.swapDetails.inputToken}
                  </span>
                </div>

                {/* Output Amount */}
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground font-medium">You Received</span>
                  <span className="text-sm font-semibold text-primary">
                    {transaction.swapDetails.outputAmount.toFixed(transaction.swapDetails.outputToken === 'ETH' ? 6 : 2)} {transaction.swapDetails.outputToken}
                  </span>
                </div>

                {/* Exchange Rate */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground font-medium">Exchange Rate</span>
                  <span className="text-sm font-semibold text-foreground">
                    1 {transaction.swapDetails.inputToken} = {(transaction.swapDetails.outputAmount / transaction.swapDetails.inputAmount).toFixed(6)} {transaction.swapDetails.outputToken}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Details</h3>
            
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Date & Time</span>
                <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">
                  {formatDate(transaction.timestamp)}
                </span>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">
                  {transaction.type === 'swap' ? 'Output Amount' : 'Amount'}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {transaction.type === 'accrue' ? transaction.amount.toFixed(6) : 
                   transaction.token === 'ETH' ? transaction.amount.toFixed(6) : 
                   transaction.amount.toFixed(2)} {transaction.token}
                </span>
              </div>

              {/* Type/Service */}
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">
                  {transaction.type === 'swap' ? 'Service' : 'Vault'}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {getVaultDisplayName()}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  transaction.status === 'failed' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>

              {/* Transaction Hash */}
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatAddress(transaction.hash || hash)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.hash || hash, 'Transaction hash')}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Smart Account Address */}
              {transaction.smartAccountAddress && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground font-medium">Account Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {formatAddress(transaction.smartAccountAddress)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(transaction.smartAccountAddress!, 'Account address')}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-3 pb-20"
          >
            {(() => {
              const chainId = transaction.chainId || 534352;
              const chainInfo: Record<number, { name: string; explorer: string }> = {
                534352: { name: "Scroll", explorer: "scrollscan.com" },
                8453: { name: "Base", explorer: "basescan.org" },
                10: { name: "Optimistic", explorer: "optimistic.etherscan.io" },
                42161: { name: "Arbi", explorer: "arbiscan.io" },
                137: { name: "Polygon", explorer: "polygonscan.com" },
              };
              const info = chainInfo[chainId] || chainInfo[534352];
              return (
                <button
                  onClick={() =>
                    window.open(`https://${info.explorer}/tx/${transaction.hash || hash}`, "_blank")
                  }
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on {info.name}scan
                </button>
              );
            })()}
          </motion.div>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}