# Polystream PWA

Polystream is a mobile-first Progressive Web App (PWA) that provides a simplified DeFi yield aggregation platform designed for Web2 users new to DeFi. The app offers an intuitive, banking-app-like experience for earning crypto yields through various DeFi strategies.

## Project Overview

**Mission**: Ship a mobile‑first, production‑ready PWA that lets everyday users earn crypto yields through Polystream while feeling like a familiar Web‑2 banking app.

**Tech Stack**:
- **Framework**: Next.js 15.3.2 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom design tokens
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: Privy for wallet connection and user management
- **PWA**: Serwist service worker for offline functionality
- **Analytics**: Amplitude for user behavior tracking
- **Wallet Integration**: Permissionless for smart account functionality

## Architecture Overview

### App Structure (Next.js App Router)

```
app/
├── layout.tsx                 # Root layout with global providers
├── page.tsx                   # Root page (redirects to /sign-in)
├── globals.css                # Global styles and design tokens
├── manifest.ts                # PWA manifest configuration
├── sw.ts                      # Service worker setup
├── components/                # Shared components
├── lib/                       # Core utilities and API layer
├── [routes]/                  # Page routes
└── data/                      # Static data and mock data
```

### Core Routes

**Authentication & Onboarding**:
- `/sign-in` - User authentication with Privy
- `/onboarding` - New user onboarding flow

**Main App Navigation** (Tab-based mobile navigation):
- `/home` - Dashboard with portfolio overview
- `/market` - Available vaults and yield opportunities
- `/discover` - Educational content and discover features
- `/portfolio` - User's positions and transaction history

**Transaction Flows**:
- `/buy` - Purchase tokens with fiat
- `/receive` - Receive tokens (address/QR code)
- `/withdraw` - Withdraw funds from vaults
- `/vault/[id]` - Individual vault details and management

## Component Architecture

### 1. Layout & Navigation
- **Root Layout** (`app/layout.tsx`): Global providers, fonts, analytics
- **Tab Navigation** (`components/TabNavigation.tsx`): Mobile-first bottom tab navigation
<!-- - **App Sidebar** (`components/app-sidebar.tsx`): Desktop sidebar navigation -->

### 2. Provider Structure
```tsx
<QueryProvider>          // TanStack Query for API state
  <ServiceWorkerRegistration />  // PWA service worker
  <PrivyProviderWrapper>         // Authentication provider
    {children}
  </PrivyProviderWrapper>
</QueryProvider>
```

### 3. Component Organization

**Feature-based Components**:
- `components/buy/` - Token purchase flow components
- `components/vault/` - Vault management components  
- `components/portfolio/` - Portfolio display components
- `components/transfer/` - Transfer and transaction components
- `components/market/` - Market discovery components
- `components/discover/` - Educational content components

**Shared UI Components**:
- `components/ui/` - Reusable UI primitives (buttons, cards, etc.)

### 4. Authentication Flow
- **Privy Integration**: Handles wallet connection and user authentication
- **Smart Account**: Uses Permissionless for account abstraction
- **Multi-chain Support**: Configured for multiple blockchain networks

## Data Management

### 1. State Management Strategy

**Server State** (TanStack Query):
- User data and authentication state
- Vault information and APY data
- Transaction history
- Portfolio positions
- USDC balances across chains

**Client State** (React hooks):
- UI state (modals, tabs, loading states)
- Form state
- Navigation state

### 2. API Layer (`app/lib/api.ts`)

**Mock API Implementation** for development:
```typescript
interface ApiInterface {
  // User Management
  getUser(): Promise<User>
  updateUser(userData: Partial<User>): Promise<User>
  
  // Wallet & Balances
  getWallet(): Promise<Wallet>
  updateWalletBalance(amount: number, tokenId: string): Promise<Wallet>
  
  // Transactions
  getTransactions(): Promise<Transaction[]>
  createTransaction(transaction): Promise<Transaction>
  
  // Vaults & Yields
  getVaults(): Promise<Vault[]>
  getVaultPositions(): Promise<VaultPosition[]>
  depositToVault(vaultId: string, amount: number): Promise<Transaction>
  withdrawFromVault(vaultId: string, amount: number): Promise<Transaction>
  
  // Yield Simulation
  startYieldSimulation(): void
  stopYieldSimulation(): void
}
```

### 3. Data Types (`app/lib/types.ts`)

**Core Entities**:
- `UserData`: User profile and wallet information
- `Wallet`: Token balances and total portfolio value
- `Transaction`: Transaction history with status tracking
- `Vault`: DeFi vault details with APY and pool information
- `VaultPosition`: User's staked positions in vaults

**Multi-chain Support**:
- `MultiChainWalletData`: Smart account data per chain
- `ChainWalletData`: Individual chain wallet information

### 4. Vault System (`app/data/vaults.ts`)

**Vault Structure**:
```typescript
interface Vault {
  id: string
  name: string
  apy: number           // Current APY
  apy7d/30d/90d: number // Historical APY data
  deposits: number      // Total deposits in vault
  liquidity: number     // Available liquidity
  riskLevel: "Low" | "Medium" | "High"
  trend: "up" | "down" | "stable"
  pools: Pool[]         // Underlying DeFi protocols
  vaultAddress?: string // Smart contract address
}
```

**Available Vaults**:
- **Stable Yield**: Low-risk USDC strategy (Aave, Compound)
- **ETH Staking**: Medium-risk ETH staking (Lido, Rocket Pool)
- **ETH Restaking**: High-risk restaking strategy
- **BTC Strategy**: High-risk Bitcoin yield strategy

## Data Flow Architecture

### 1. Data Flow Overview

The Polystream app implements a layered data architecture with clear separation of concerns:

```
UI Components → Custom Hooks → TanStack Query → API Layer → Data Sources
     ↑              ↑              ↑           ↑           ↑
   React         Abstraction    Cache &      Business    Mock/Real
Components     & State Logic   Network      Logic       APIs
```

### 2. Layer Responsibilities

#### **UI Components Layer**
- **Role**: Pure presentation logic, user interactions, loading states
- **Data Access**: Only through custom hooks, never direct API calls
- **Examples**: `WalletBalance.tsx`, `ProfileHeader.tsx`, `VaultWithdrawDrawer.tsx`

```tsx
// Example: WalletBalance component
const Wallet: React.FC<WalletProps> = ({ ... }) => {
  // ✅ Correct: Uses custom hook for data access
  const { data: userData, isLoading } = useUserData();
  const balance = parseFloat(userData?.usdcBalance || "0");
  
  return (
    <div>
      {isLoading ? <Skeleton /> : <Balance amount={balance} />}
    </div>
  );
};
```

#### **Custom Hooks Layer** (`app/lib/hooks.ts`)
- **Role**: Data fetching abstraction, business logic, state composition
- **Responsibilities**:
  - Wrap TanStack Query calls with app-specific logic
  - Handle authentication dependencies
  - Compose multiple data sources
  - Provide loading states and error handling
  - Cache invalidation logic

```typescript
// Example: User data hook with multi-chain wallet integration
export function useUserData() {
  const { user: privyUser, authenticated, ready } = usePrivy();
  const { data: multiChainWalletData } = useMultiChainSmartWallet();

  return useQuery({
    queryKey: [QueryKeys.user, privyUser?.id, multiChainWalletData],
    queryFn: async (): Promise<UserData> => {
      if (!authenticated || !privyUser) {
        throw new Error("User not authenticated");
      }
      return await userAPI.getUserData(privyUser, multiChainWalletData);
    },
    enabled: ready && authenticated && !!privyUser,
    staleTime: 30000,
    retry: 2,
  });
}
```

#### **TanStack Query Layer**
- **Role**: Server state management, caching, background updates
- **Features**:
  - Automatic caching with configurable stale times
  - Background refetching on window focus/reconnect
  - Optimistic updates for mutations
  - Query invalidation for data consistency
  - Loading and error state management

**Query Key Strategy**:
```typescript
export const QueryKeys = {
  user: "user",
  wallet: "wallet", 
  smartWallet: "smartWallet",
  transactions: "transactions",
  vaults: "vaults",
  vault: (id: string) => ["vault", id],
  vaultPositions: "vaultPositions",
  vaultPosition: (id: string) => ["vaultPosition", id],
  totalAssets: "totalAssets",
};
```

#### **API Layer** (`app/lib/api/`)
- **Role**: Data transformation, business logic, external service integration
- **Structure**:
  - `user-api.ts`: User profile and authentication data
  - `wallet-api.ts`: Multi-chain smart wallet operations
  - `transaction-api.ts`: Transaction history and status
  - `api.ts`: Legacy mock API for development

```typescript
// Example: Multi-chain balance fetching
class UserAPI implements UserApiInterface {
  async getUserData(privyUser: any, multiChainWalletData?: any): Promise<UserData> {
    const usdcBalances: { [chainName: string]: string } = {};
    
    if (multiChainWalletData) {
      const activeChains = getActiveChainConfigs();
      
      // Fetch balance for each active chain
      for (const chainConfig of activeChains) {
        const chainName = chainConfig.chain.name;
        const walletData = multiChainWalletData[chainName];
        
        if (walletData?.smartAccountAddress) {
          const balance = await this.getUsdcBalanceForChain(
            walletData.smartAccountAddress,
            chainConfig
          );
          usdcBalances[chainName] = balance;
        }
      }
    }
    
    return { ...userData, usdcBalances };
  }
}
```

### 3. Data Flow Patterns

#### **Query Pattern** (Read Operations)
```
Component → Custom Hook → useQuery → API Method → Data Source
    ↓           ↓           ↓          ↓           ↓
Loading UI → Loading State → Cache → Transform → Raw Data
```

**Example Flow - User Balance Display**:
1. `WalletBalance` component mounts
2. Calls `useUserData()` hook
3. Hook calls `useQuery` with user and wallet dependencies
4. TanStack Query checks cache, initiates fetch if needed
5. Calls `userAPI.getUserData()` with authentication context
6. API fetches balances from multiple blockchain networks
7. Data flows back through layers with loading states
8. Component renders balance with proper formatting

#### **Mutation Pattern** (Write Operations)
```
User Action → Custom Hook → useMutation → API Method → Side Effects
     ↓            ↓            ↓           ↓            ↓
  onClick → mutate() → Optimistic → Transform → Cache Invalidation
```

**Example Flow - Vault Deposit**:
1. User clicks "Deposit" in vault component
2. Calls `useDepositToVault()` mutation hook
3. Hook executes mutation with vault ID and amount
4. Calls `api.depositToVault()` method
5. API processes deposit and returns transaction
6. Mutation success triggers cache invalidation:
   - Vault positions refresh
   - Transaction history updates
   - Wallet balance updates

#### **Real-time Updates Pattern**
```
Background Process → API → TanStack Query → Hook → Component
        ↓             ↓         ↓             ↓        ↓
   Yield Simulation → Mock → Background Refetch → State → UI Update
```

### 4. Query Configuration & Optimization

#### **Stale Time Strategy**:
- **User Data**: 30 seconds (frequent updates for balance changes)
- **Vault Data**: 5 minutes (APY changes less frequently)
- **Smart Wallet**: Infinity (deployment state rarely changes)
- **Transactions**: 30 seconds (new transactions appear regularly)

#### **Cache Invalidation Strategy**:
```typescript
// After successful vault deposit
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: [QueryKeys.vaultPositions] });
  queryClient.invalidateQueries({ queryKey: [QueryKeys.transactions] });
  queryClient.invalidateQueries({ queryKey: [QueryKeys.wallet] });
}
```

#### **Conditional Queries**:
```typescript
// Only fetch when user is authenticated
enabled: ready && authenticated && !!privyUser,

// Only fetch when wallet address is available
enabled: !!walletAddress,

// Disable during logout to prevent unnecessary calls
enabled: !isLoggingOut && authenticated
```

### 5. Error Handling & Loading States

#### **Layered Error Handling**:
1. **API Layer**: Catches network/parsing errors, provides fallback data
2. **Hook Layer**: Provides error state to components
3. **Component Layer**: Displays user-friendly error messages

#### **Loading State Management**:
```typescript
// Composite loading states in hooks
export function useTotalAssets() {
  const userDataQuery = useUserData();
  
  return {
    totalAssets: calculateTotal(userDataQuery.data),
    isLoading: userDataQuery.isLoading,
    error: userDataQuery.error,
  };
}
```

#### **Skeleton Loading Pattern**:
```tsx
{isLoading ? (
  <div className="h-5 bg-muted animate-pulse rounded w-24" />
) : (
  <span className="text-base font-medium">{userData.name}</span>
)}
```

### 6. Development vs Production Data Flow

#### **Development Mode**:
- **Mock APIs**: Simulated data with realistic delays
- **Yield Simulation**: Real-time mock yield generation
- **Local Storage**: Persists user preferences
- **Hot Reload**: Preserves query cache during development

#### **Production Mode** (Planned):
- **Real APIs**: Blockchain RPCs, backend services
- **WebSocket**: Real-time price and yield updates
- **Database**: Persistent user data and transaction history
- **CDN**: Optimized asset delivery

### 7. Performance Optimizations

#### **Query Optimization**:
- **Parallel Queries**: Independent data fetched simultaneously
- **Dependent Queries**: Chain queries that depend on previous results
- **Background Updates**: Stale-while-revalidate pattern
- **Selective Invalidation**: Only refresh affected data

#### **Component Optimization**:
- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **Lazy Loading**: Route-based code splitting
- **Virtualization**: Large transaction lists (planned)
