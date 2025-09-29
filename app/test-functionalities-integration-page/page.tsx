"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useUserData, useMultiChainSmartWallet, useTotalAssets } from "@/app/lib/hooks";
import { useMainnetTransaction } from "@/app/components/MainnetTransactionProvider";
import { getVaultConfig } from "@/app/lib/config/vaults";
import { 
  Wallet, 
  Vault, 
  ArrowDownUp, 
  RefreshCw, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ArrowUpDown
} from "lucide-react";
import toast from "react-hot-toast";

interface TransactionRecord {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  vault: string;
  status: "pending" | "success" | "failed";
  hash?: string;
  timestamp: Date;
}

export default function TestFunctionalitiesPage() {
  const { data: userData, refetch: refreshUserInfo, isLoading: isLoadingUserData } = useUserData();
  const { data: smartWalletData, isLoading: isInitializing } = useMultiChainSmartWallet();
  const { totalAssets, walletBalance } = useTotalAssets();
  
  const smartAccount = smartWalletData?.chains ? Object.values(smartWalletData.chains)[0]?.smartAccount : null;
  const smartAccountAddress = smartWalletData?.smartAccountAddress || "";
  const isSmartAccountReady = !!smartAccount && !!smartAccountAddress;
  const accountBalance = walletBalance || 0;
  
  // Get aggregated vault balance data from userData
  const virtualVaultBalance = parseFloat(userData?.virtualVault?.withdrawableUsdc || "0");
  const combinedVaultBalance = parseFloat(userData?.combinedVault?.withdrawableUsdc || "0");
  const totalVaultBalance = parseFloat(userData?.totalWithdrawableUsdc || "0");
  const vaultBalance = totalVaultBalance; // Total withdrawable USDC from both vaults
  const totalBalance = accountBalance + vaultBalance;

  const { transferWalletToVault, transferVaultToWallet } = useMainnetTransaction();

  // Component state
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  // Only Virtual Vault is used for user interactions
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [bridgeInProgress, setBridgeInProgress] = useState(false);

  const vaultConfig = getVaultConfig('stableyield');
  if (!vaultConfig) {
    throw new Error("Stable yield vault config not found");
  }
  const { virtualVaultAddress, combinedVaultAddress } = vaultConfig;

  const vaultInfo = {
    name: "Aggregated Vaults",
    balance: vaultBalance, // Total withdrawable USDC amount
    virtualVault: {
      vvtBalance: parseFloat(userData?.virtualVault?.vvtBalance || "0"),
      withdrawableUsdc: virtualVaultBalance,
    },
    combinedVault: {
      cvtBalance: parseFloat(userData?.combinedVault?.cvtBalance || "0"),
      withdrawableUsdc: combinedVaultBalance,
    },
    totalWithdrawableUsdc: totalVaultBalance,
    color: "bg-blue-100 text-blue-800",
    virtualVaultAddress: virtualVaultAddress,
    combinedVaultAddress: combinedVaultAddress,
    description: "Virtual Vault + Combined Vault aggregated balance"
  };

  const addTransaction = (transaction: Omit<TransactionRecord, "id" | "timestamp">) => {
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransactionStatus = (id: string, status: "success" | "failed", hash?: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, status, hash } : tx
      )
    );
  };

  const handleDeposit = async () => {
    if (!depositAmount || !smartAccount) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0 || amount > accountBalance) {
      toast.error("Invalid deposit amount");
      return;
    }

    setIsDepositing(true);
    const transactionId = Math.random().toString(36).substr(2, 9);
    
    addTransaction({
      type: "deposit",
      amount,
      vault: vaultInfo.name,
      status: "pending"
    });

    try {
      const result = await transferWalletToVault(amount);
      
      if (result?.success) {
        updateTransactionStatus(transactionId, "success", result.transactionHash);
        
        if (result.crossChain) {
          // Set bridge in progress state to true
          setBridgeInProgress(true);
          
          toast.success(`Cross-chain deposit initiated! USDC is being bridged from Base to Scroll.`, { duration: 6000 });
          
          // Add a second toast with more information
          setTimeout(() => {
            toast(
              (t) => (
                <div>
                  <p className="font-medium mb-1">Automatic Deposit Enabled</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Funds will be automatically deposited when they arrive on Scroll. No further action needed.
                  </p>
                  <div className="flex justify-end">
                    <button 
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      onClick={() => {
                        toast.dismiss(t.id);
                        refreshUserInfo();
                        // Check if funds have arrived and clear bridge progress
                        if (vaultBalance > 0) {
                          setBridgeInProgress(false);
                        }
                      }}
                    >
                      Refresh Balances
                    </button>
                  </div>
                </div>
              ),
              { duration: 10000 }
            );
          }, 1000);
          
          // Set a timeout to automatically turn off the bridge in progress state
          // This is a fallback in case the automatic polling doesn't reset it
          setTimeout(() => {
            setBridgeInProgress(false);
          }, 600000); // 10 minutes timeout (reduced from 15)
        } else {
          toast.success(`Successfully deposited ${amount} USDC to ${vaultInfo.name}`);
        }
        
        setDepositAmount("");
        await refreshUserInfo();
      } else {
        updateTransactionStatus(transactionId, "failed");
        toast.error("Deposit failed");
      }
    } catch (error) {
      updateTransactionStatus(transactionId, "failed");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Deposit failed: " + errorMessage);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !smartAccount) return;

    const amount = parseFloat(withdrawAmount);
    const selectedVaultBalance = vaultInfo.totalWithdrawableUsdc;
    
    if (amount <= 0 || amount > selectedVaultBalance) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    setIsWithdrawing(true);
    const transactionId = Math.random().toString(36).substr(2, 9);
    
    addTransaction({
      type: "withdraw",
      amount,
      vault: vaultInfo.name,
      status: "pending"
    });

    try {
      const result = await transferVaultToWallet(amount);
      
      if (result?.success) {
        updateTransactionStatus(transactionId, "success", result.withdrawHash);
        toast.success(`Successfully withdrew ${amount} USDC from ${vaultInfo.name}`);
        setWithdrawAmount("");
        await refreshUserInfo();
      } else {
        updateTransactionStatus(transactionId, "failed");
        toast.error("Withdrawal failed");
      }
    } catch (error) {
      updateTransactionStatus(transactionId, "failed");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Withdrawal failed: " + errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Effect to detect when vault balance increases after a bridge
  useEffect(() => {
    if (bridgeInProgress && vaultBalance > 0) {
      // If we have vault balance and bridge was in progress, funds have likely arrived
      setBridgeInProgress(false);
      toast.success("Funds have been bridged and deposited to your vault!", { 
        icon: "🎉",
        duration: 5000
      });
    }
  }, [vaultBalance, bridgeInProgress]);

  // Effect to listen for the bridge deposit success event
  useEffect(() => {
    const handleBridgeDepositSuccess = (event: any) => {
      const { amount, hash } = event.detail;
      
      // Clear bridge in progress state
      setBridgeInProgress(false);
      
      // Show success toast with amount
      toast.success(
        <div>
          <p><span className="font-bold">Bridge & Deposit Complete!</span></p>
          <p className="text-sm">{amount} USDC has been automatically deposited to your vault.</p>
        </div>, 
        { 
          icon: "🎉",
          duration: 8000
        }
      );
      
      // Refresh user data to update balances
      refreshUserInfo();
    };
    
    window.addEventListener('bridgeDepositSuccess', handleBridgeDepositSuccess);
    
    return () => {
      window.removeEventListener('bridgeDepositSuccess', handleBridgeDepositSuccess);
    };
  }, [refreshUserInfo]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Initializing smart account...</p>
        </div>
      </div>
    );
  }

  if (!isSmartAccountReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Smart Account Not Ready</h2>
            <p className="text-gray-600 mb-4">Please ensure you're connected with a wallet</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Functionalities Integration
          </h1>
          <p className="text-gray-600">
            Test deposits, withdrawals, and smart account interactions with Kernel + Pimlico on Scroll Mainnet
          </p>
          <div className="mt-2">
            <Badge variant="outline" className="mr-2">Scroll Mainnet (534352)</Badge>
            <Badge variant="outline">Production Contracts</Badge>
          </div>
        </div>

        {/* Account Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Smart Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account Address</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {smartAccountAddress || "Not connected"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={isSmartAccountReady ? "default" : "destructive"}>
                  {isSmartAccountReady ? "Ready" : "Not Ready"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <Badge variant="outline">Kernel + Pimlico (Mainnet)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold">${accountBalance.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vault Balance</p>
                  <p className="text-2xl font-bold">${vaultInfo.balance.toLocaleString()}</p>
                </div>
                <Vault className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={async () => {
                    console.log("Manual refresh triggered");
                    console.log("Smart wallet data:", smartWalletData);
                    console.log("Smart account address:", smartAccountAddress);
                    await refreshUserInfo();
                  }}
                  className={`w-full ${bridgeInProgress ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' : ''}`}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${bridgeInProgress ? 'animate-spin text-yellow-600' : ''}`} />
                  {bridgeInProgress ? 'Check Bridge Status' : 'Refresh Balances'}
                </Button>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Mainnet Environment</p>
                  <p className="text-xs text-gray-500">Real USDC Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit/Withdraw Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5" />
                Vault Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>

                {/* Vault Info */}
                <div className="mt-4">
                  <div className="bg-blue-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-blue-900">{vaultInfo.name}</h3>
                      <Badge className={vaultInfo.color}>Active</Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">{vaultInfo.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Your Balance:</span>
                      <span className="font-bold text-blue-900">${vaultInfo.balance.toLocaleString()} USDC</span>
                    </div>
                  </div>
                </div>

                <TabsContent value="deposit" className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Amount (USDC)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      max={accountBalance}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: ${accountBalance.toLocaleString()} USDC
                    </p>
                  </div>
                  <Button 
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="w-full"
                  >
                    {isDepositing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Depositing...
                      </>
                    ) : (
                      "Deposit to Vault"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Amount (USDC)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={vaultInfo.balance}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: ${vaultInfo.balance.toLocaleString()} USDC
                    </p>
                  </div>
                  <Button 
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full"
                  >
                    {isWithdrawing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      "Withdraw from Vault"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Vault Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vault Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-lg">{vaultInfo.name}</p>
                      <p className="text-sm text-gray-600">{vaultInfo.description}</p>
                    </div>
                    <Badge className={vaultInfo.color}>Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Contract Address:</p>
                      <p className="font-mono text-xs bg-gray-100 p-1 rounded">
                        VV: {vaultInfo.virtualVaultAddress.slice(0, 6)}...{vaultInfo.virtualVaultAddress.slice(-4)}
                      </p>
                      <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                        CV: {vaultInfo.combinedVaultAddress.slice(0, 6)}...{vaultInfo.combinedVaultAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Total Withdrawable:</p>
                      <div className="flex items-center justify-end">
                        <p className="text-2xl font-bold text-blue-600">${vaultInfo.totalWithdrawableUsdc.toLocaleString()}</p>
                        {bridgeInProgress && (
                          <div className="ml-2 relative" title="Cross-chain bridge in progress">
                            <ArrowUpDown className="h-5 w-5 text-yellow-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-blue-500 mt-1 space-y-1">
                        {vaultInfo.virtualVault.withdrawableUsdc > 0 && (
                          <p>VV: ${vaultInfo.virtualVault.withdrawableUsdc.toLocaleString()}</p>
                        )}
                        {vaultInfo.combinedVault.withdrawableUsdc > 0 && (
                          <p>CV: ${vaultInfo.combinedVault.withdrawableUsdc.toLocaleString()}</p>
                        )}
                        {bridgeInProgress && (
                          <p className="text-yellow-600 font-medium flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Funds being bridged...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {(vaultInfo.virtualVault.vvtBalance > 0 || vaultInfo.combinedVault.cvtBalance > 0) && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Vault Breakdown:</h4>
                    
                    {vaultInfo.virtualVault.vvtBalance > 0 && (
                      <div className="mb-3 pb-3 border-b border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-blue-800">Virtual Vault (VVT):</span>
                          <span className="text-sm text-blue-600">{vaultInfo.virtualVault.vvtBalance.toLocaleString()} VVT</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-blue-700">Withdrawable:</span>
                          <span className="text-xs text-blue-600">${vaultInfo.virtualVault.withdrawableUsdc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-700">Rate:</span>
                          <span className="text-xs text-blue-600">
                            1 VVT = ${(vaultInfo.virtualVault.withdrawableUsdc / vaultInfo.virtualVault.vvtBalance).toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {vaultInfo.combinedVault.cvtBalance > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-blue-800">Combined Vault (CVT):</span>
                          <span className="text-sm text-blue-600">{vaultInfo.combinedVault.cvtBalance.toLocaleString()} CVT</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-blue-700">Withdrawable:</span>
                          <span className="text-xs text-blue-600">${vaultInfo.combinedVault.withdrawableUsdc.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-700">Rate:</span>
                          <span className="text-xs text-blue-600">
                            1 CVT = ${(vaultInfo.combinedVault.withdrawableUsdc / vaultInfo.combinedVault.cvtBalance).toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200">
                      Vault tokens represent your share. Conversion rates may change based on yield earned.
                    </p>
                  </div>
                )}
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Funds deposited to Virtual Vault are automatically moved to yield-generating protocols by our backend system for optimal returns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(tx.status)}
                        <div>
                          <p className="font-medium capitalize">
                            {tx.type} - {tx.vault}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tx.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {tx.type === "withdraw" ? "-" : "+"}${tx.amount.toLocaleString()}
                        </p>
                        {tx.hash && (
                          <a
                            href={`https://scrollscan.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}