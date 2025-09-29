import { User, Wallet, Transaction, VaultPosition } from './types';
import { Vault } from '../data/vaults';

// This is a mock API client that simulates API calls
// In production, this would be replaced with actual API calls

// Mock data
const mockUser: User = {
  id: 'user1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatarUrl: '/avatar.png',
  walletAddress: '0x1234...5678',
};

const mockWallet: Wallet = {
  address: '0x1234...5678',
  totalBalance: 0, // Starting with 0 balance
  tokens: [
    {
      id: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      logoUrl: '/token/usdc.png',
      balance: 0, // Starting with 0 balance
      value: 0, // Starting with 0 value
      price: 1,
      change24h: 0,
    },
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      logoUrl: '/token/eth.png',
      balance: 0, // Starting with 0 balance
      value: 0, // Starting with 0 value
      price: 2209,
      change24h: 2.5,
    },
  ],
};

// Starting with empty transactions
const mockTransactions: Transaction[] = [];

// Starting with 0 position values
const mockVaultPositions: VaultPosition[] = [
  {
    vaultId: 'stableyield',
    stakedAmount: 0,
    totalYield: 0,
    yesterdayYield: 0,
    token: 'USDC',
    value: 0,
  },
  {
    vaultId: 'degenyield',
    stakedAmount: 0,
    totalYield: 0,
    yesterdayYield: 0,
    token: 'USDC',
    value: 0,
  },
  {
    vaultId: 'ethrestaking',
    stakedAmount: 0,
    totalYield: 0,
    yesterdayYield: 0,
    token: 'ETH',
    value: 0,
  },
  {
    vaultId: 'btcstrategy',
    stakedAmount: 0,
    totalYield: 0,
    yesterdayYield: 0,
    token: 'BTC',
    value: 0,
  },
];

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Store mock data in memory to persist during the session
let wallet = { ...mockWallet };
let transactions = [...mockTransactions];
let vaultPositions = [...mockVaultPositions];

// Interface for the API object with _yieldInterval property
interface ApiInterface {
  _yieldInterval: NodeJS.Timeout | null;
  getUser(): Promise<User>;
  updateUser(userData: Partial<User>): Promise<User>;
  getWallet(): Promise<Wallet>;
  updateWalletBalance(amount: number, tokenId: string): Promise<Wallet>;
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'timestamp' | 'status'>): Promise<Transaction>;
  getVaults(): Promise<Vault[]>;
  getVaultById(id: string): Promise<Vault | undefined>;
  getVaultPositions(): Promise<VaultPosition[]>;
  getVaultPosition(vaultId: string): Promise<VaultPosition | undefined>;
  depositToVault(vaultId: string, amount: number, token: string): Promise<Transaction>;
  withdrawFromVault(vaultId: string, amount: number, token: string): Promise<Transaction>;
  buyTokens(amount: number, token: string): Promise<Transaction>;
  startYieldSimulation(): void;
  stopYieldSimulation(): void;
}

// API methods
export const api: ApiInterface = {
  _yieldInterval: null,
  
  // User methods
  async getUser(): Promise<User> {
    await delay(500);
    return { ...mockUser };
  },
  
  async updateUser(userData: Partial<User>): Promise<User> {
    await delay(700);
    return { ...mockUser, ...userData };
  },
  
  // Wallet methods
  async getWallet(): Promise<Wallet> {
    await delay(600);
    return { ...wallet };
  },
  
  async updateWalletBalance(amount: number, tokenId: string = 'usdc'): Promise<Wallet> {
    await delay(600);
    const tokenIndex = wallet.tokens.findIndex(token => token.id === tokenId);
    
    if (tokenIndex >= 0) {
      // Update token balance
      wallet.tokens[tokenIndex].balance += amount;
      wallet.tokens[tokenIndex].value = wallet.tokens[tokenIndex].balance * wallet.tokens[tokenIndex].price;
      
      // Update total wallet balance
      wallet.totalBalance = wallet.tokens.reduce((total, token) => total + token.value, 0);
    }
    
    return { ...wallet };
  },
  
  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    await delay(800);
    return [...transactions];
  },
  
  async createTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'timestamp' | 'status'>): Promise<Transaction> {
    await delay(1000);
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
      status: 'completed',
      ...transaction,
    };
    
    // Add to transactions list
    transactions = [newTransaction, ...transactions];
    
    return newTransaction;
  },
  
  // Vault methods
  async getVaults(): Promise<Vault[]> {
    await delay(700);
    // Import vaults from the existing data file
    const { vaults } = await import('../data/vaults');
    return [...vaults];
  },
  
  async getVaultById(id: string): Promise<Vault | undefined> {
    await delay(500);
    const { vaults } = await import('../data/vaults');
    return vaults.find(vault => vault.id === id);
  },
  
  // Vault positions methods
  async getVaultPositions(): Promise<VaultPosition[]> {
    await delay(600);
    return [...vaultPositions];
  },
  
  async getVaultPosition(vaultId: string): Promise<VaultPosition | undefined> {
    await delay(500);
    return vaultPositions.find(position => position.vaultId === vaultId);
  },
  
  // Deposit to vault
  async depositToVault(vaultId: string, amount: number, token: string): Promise<Transaction> {
    await delay(1200);
    
    // Find the vault position
    const positionIndex = vaultPositions.findIndex(position => position.vaultId === vaultId);
    
    if (positionIndex >= 0) {
      // Update vault position
      vaultPositions[positionIndex].stakedAmount += amount;
      vaultPositions[positionIndex].value = vaultPositions[positionIndex].stakedAmount * 
        (token.toLowerCase() === 'eth' ? 2209 : token.toLowerCase() === 'btc' ? 67050 : 1);
      
      // Deduct from wallet
      await this.updateWalletBalance(-amount, token.toLowerCase());
    }
    
    // Create transaction
    return this.createTransaction({
      type: 'deposit',
      amount,
      token,
      vaultId,
      vaultName: (await this.getVaultById(vaultId))?.name,
      smartAccountAddress: mockUser.walletAddress || '',
    });
  },
  
  // Withdraw from vault
  async withdrawFromVault(vaultId: string, amount: number, token: string): Promise<Transaction> {
    await delay(1200);
    
    // Find the vault position
    const positionIndex = vaultPositions.findIndex(position => position.vaultId === vaultId);
    
    if (positionIndex >= 0) {
      // Update vault position
      vaultPositions[positionIndex].stakedAmount = Math.max(0, vaultPositions[positionIndex].stakedAmount - amount);
      vaultPositions[positionIndex].value = vaultPositions[positionIndex].stakedAmount * 
        (token.toLowerCase() === 'eth' ? 2209 : token.toLowerCase() === 'btc' ? 67050 : 1);
      
      // Add to wallet
      await this.updateWalletBalance(amount, token.toLowerCase());
    }
    
    // Create transaction
    return this.createTransaction({
      type: 'withdraw',
      amount,
      token,
      vaultId,
      vaultName: (await this.getVaultById(vaultId))?.name,
      smartAccountAddress: mockUser.walletAddress || '',
    });
  },
  
  // Add funds to wallet (buy)
  async buyTokens(amount: number, token: string = 'usdc'): Promise<Transaction> {
    await delay(1000);
    
    // Add to wallet
    await this.updateWalletBalance(amount, token.toLowerCase());
    
    // Create transaction
    return this.createTransaction({
      type: 'deposit',
      amount,
      token: token.toUpperCase(),
      smartAccountAddress: mockUser.walletAddress || '',
    });
  },

  // Add yield accrual simulation
  startYieldSimulation() {
    // Check if simulation is already running
    if (this._yieldInterval) return;
    
    // Start a yield simulation that runs every minute
    this._yieldInterval = setInterval(async () => {
      // Only generate yield if there are positions with funds
      const activePositions = vaultPositions.filter(pos => pos.stakedAmount > 0);
      
      if (activePositions.length === 0) return;
      
      // For each active position, add a small yield
      for (const position of activePositions) {
        // Calculate yield based on APY (assuming vault APY is around 5-10%)
        // This will generate roughly the annual yield percent daily, divided by minutes 
        const vaultApy = 0.08; // 8% APY
        const dailyYieldRate = vaultApy / 365;
        const minuteYieldRate = dailyYieldRate / 1440; // 1440 minutes in a day
        
        // Calculate yield amount (simplified)
        const yieldAmount = position.stakedAmount * minuteYieldRate;
        
        // Update the position
        position.totalYield += yieldAmount;
        position.yesterdayYield += yieldAmount;
        
        // Every few yield accruals, create a yield transaction (1/10 chance)
        if (Math.random() < 0.1 && yieldAmount > 0.01) {
          await this.createTransaction({
            type: 'yield',
            amount: yieldAmount,
            token: position.token,
            vaultId: position.vaultId,
            vaultName: (await this.getVaultById(position.vaultId))?.name,
            smartAccountAddress: mockUser.walletAddress || '',
          });
        }
      }
    }, 60000); // Run every minute
  },

  // Stop yield simulation
  stopYieldSimulation() {
    if (this._yieldInterval) {
      clearInterval(this._yieldInterval);
      this._yieldInterval = null;
    }
  }
}; 