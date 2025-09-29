// User types
export interface UserData {
  id: string;
  name: string;
  email: string;
  embeddedWalletAddress: string | null;
  smartWalletAddress: string | null;
  usdcBalances: { [chainName: string]: string }; // Raw balance per chain
  usdcBalancesFormatted: { [chainName: string]: string }; // Formatted balance per chain
  totalUsdcBalance: string; // Total across all chains
  totalUsdcBalanceFormatted: string; // Formatted total
  // NEW: ETH balances
  ethBalances: { [chainName: string]: string };
  ethBalancesFormatted: { [chainName: string]: string };
  totalEthBalance: string;
  totalEthBalanceFormatted: string;
  // NEW: USDT balances
  usdtBalances: { [chainName: string]: string };
  usdtBalancesFormatted: { [chainName: string]: string };
  totalUsdtBalance: string;
  totalUsdtBalanceFormatted: string;
  // Aggregated Vault data
  virtualVault: {
    vvtBalance: string;
    withdrawableUsdc: string;
  };
  combinedVault: {
    cvtBalance: string;
    withdrawableUsdc: string;
  };
  totalWithdrawableUsdc: string; // Total withdrawable from both vaults
  totalWithdrawableUsdcFormatted: string; // Formatted total withdrawable
  individualVaultBalances: { [vaultId: string]: string }; // Individual vault balances for position tracking
}

export interface UserApiInterface {
  getUserData(privyUser: any, multiChainWalletData?: MultiChainWalletData): Promise<UserData>;
  getDefaultDisplayName(privyUser: any): string;
  getAdditionalUserInfo(privyUser: any, wallets: any[]): string | null;
}

// Smart wallet types - Keep minimal for individual chain data
export interface ChainWalletData {
  smartAccount: any | null;
  smartAccountAddress: string | null;
  isInitialized: boolean;
  isDeployed: boolean;
}

// Multi-chain wallet data
export interface MultiChainWalletData {
  [chainName: string]: ChainWalletData;
}

// Multi-chain wallet summary - Main interface to use
export interface MultiChainWalletSummary {
  embeddedWalletAddress: string;
  smartAccountAddress: string; // Same across all chains
  chains: {
    [chainName: string]: {
      isInitialized: boolean;
      isDeployed: boolean;
      smartAccount: any | null;
    };
  };
  totalChainsInitialized: number;
  totalChainsDeployed: number;
  isFullyDeployed: boolean;
}

export interface WalletApiInterface {
  initializeSmartAccount(privyWallet: any): Promise<MultiChainWalletSummary>;
  deploySmartAccount(): Promise<boolean>;
  getMultiChainSummary(): MultiChainWalletSummary | null;
  clearWalletData(): void;
  formatAddress(address: string | null): string;
}

// ========= MOCK ===========
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  walletAddress?: string;
}

// Types for wallet data
export interface Token {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;
  balance: number;
  value: number;
  price: number;
  change24h: number;
}

export interface Wallet {
  address: string;
  totalBalance: number;
  tokens: Token[];
}

// Types for vault positions
export interface VaultPosition {
  vaultId: string;
  stakedAmount: number;
  totalYield: number;
  yesterdayYield: number;
  token: string;
  value: number;
}

// Types for transactions
export type TransactionType = 'deposit' | 'withdraw' | 'accrue' | 'transfer-in' | 'transfer-out' | 'yield' | 'swap' | 'other';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  timestamp: number;
  amount: number;
  token: string;
  smartAccountAddress: string;
  vaultId?: string;
  vaultName?: string;
  status: TransactionStatus;
  hash?: string;
  chainId?: number;
  fromAddress?: string; // Vault address for accrue transactions
  swapDetails?: {
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    outputAmount: number;
    priceImpact?: string;
  };
}

export interface TransactionApiInterface {
  getTransactions(walletAddress: string, page?: number, offset?: number): Promise<Transaction[]>;
  getTransactionByHash(txHash: string): Promise<Transaction>;
  formatTransaction(tx: Transaction): any;
  getTransactionStatus(txHash: string): Promise<string>;
  getTransactionReceipt(txHash: string): Promise<any>;
}

// Types for application state
export interface AppState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  networkStatus: 'connected' | 'disconnected';
  darkMode: boolean;
} 