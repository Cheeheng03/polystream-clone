# Polystream Data Layer

This directory contains the data layer implementation for the Polystream web application. It uses TanStack Query (React Query) to provide a centralized data management solution.

## Architecture Overview

The data layer is built with the following components:

- **Types** (`types.ts`): Contains TypeScript interfaces and types for all data models.
- **API Client** (`api.ts`): Provides methods for interacting with the backend API (currently mock implementation).
- **Query Provider** (`query-provider.tsx`): Wraps the application with TanStack Query's `QueryClientProvider`.
- **Hooks** (`hooks.ts`): Custom React hooks that leverage TanStack Query to fetch and manage data.

## Usage

### Fetching Data

To fetch data in a component, import the appropriate hook:

```tsx
import { useVaults, useWallet } from '../lib/hooks';

function MyComponent() {
  const { data: vaults, isLoading } = useVaults();
  const { data: wallet } = useWallet();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>My Wallet: ${wallet?.totalBalance}</h1>
      <ul>
        {vaults?.map(vault => (
          <li key={vault.id}>{vault.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Mutating Data

To perform mutations (create, update, delete):

```tsx
import { useDepositToVault } from '../lib/hooks';

function DepositForm() {
  const { mutate, isLoading } = useDepositToVault();
  
  const handleDeposit = () => {
    mutate({ 
      vaultId: 'stableyield', 
      amount: 1000, 
      token: 'USDC' 
    });
  };
  
  return (
    <button 
      onClick={handleDeposit} 
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Deposit'}
    </button>
  );
}
```

## Benefits

- **Centralized State**: All data is managed in a single location
- **Caching**: Automatic caching of API responses
- **Refetching**: Intelligent refetching strategies
- **Optimistic Updates**: Support for optimistic UI updates
- **Type Safety**: Full TypeScript support
- **Background Data Synchronization**: Keeps data fresh

## Implementation Details

The data layer is implemented with a mock API in `api.ts`. In a production environment, this would be replaced with actual API calls to the backend, but the interface would remain the same to ensure a smooth transition.

Query keys are defined in the `hooks.ts` file for consistency and to prevent duplicate query keys. 