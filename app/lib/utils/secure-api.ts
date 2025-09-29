/**
 * Secure API utility to call server-side proxied APIs without exposing API keys
 */
import { http } from 'viem';

// Secure RPC call through server-side proxy
export async function secureRpcCall(chainKey: string, method: string, params: any[] = []) {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') {
    throw new Error('Secure RPC calls can only be made from the client side');
  }

  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainKey,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status}`);
  }

  return response.json();
}

// Secure Pimlico call through server-side proxy
export async function securePimlicoCall(chainKey: string, method: string, params: any[] = []) {
  if (typeof window === 'undefined') {
    throw new Error('Secure Pimlico calls can only be made from the client side');
  }

  const response = await fetch('/api/pimlico', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainKey,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Pimlico call failed: ${response.status}`);
  }

  return response.json();
}

// Get gas prices through secure Pimlico proxy
export async function getSecureGasPrice(chainKey: string) {
  const response = await fetch(`/api/pimlico?chain=${chainKey}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Gas price fetch failed: ${response.status}`);
  }

  return response.json();
}

// Get transaction history through secure blockchain explorer proxy
export async function getSecureTransactionHistory(
  chain: string,
  address: string,
  startblock?: string,
  endblock?: string
) {
  const params = new URLSearchParams({
    chain,
    address,
  });
  
  if (startblock) params.append('startblock', startblock);
  if (endblock) params.append('endblock', endblock);

  const response = await fetch(`/api/transactions/scan?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Transaction history fetch failed: ${response.status}`);
  }

  return response.json();
}

// Get fallback URLs for different chains (for SSR/build time)
function getFallbackRpcUrl(chainKey: string): string {
  switch (chainKey) {
    case 'scroll':
      return 'https://rpc.scroll.io/';
    case 'base':
      return 'https://mainnet.base.org';
    case 'polygon':
      return 'https://polygon-rpc.com';
    case 'optimism':
      return 'https://mainnet.optimism.io';
    case 'arbitrum':
      return 'https://arb1.arbitrum.io/rpc';
    case 'scrollSepolia':
      return 'https://sepolia-rpc.scroll.io/';
    default:
      return 'https://rpc.scroll.io/';
  }
}

// Create secure transport for viem that uses server-side proxy
export function createSecureTransport(chainKey: string) {
  // Return a transport function that viem expects
  return (opts?: any) => {
    // During SSR or build time, use fallback HTTP transport
    if (typeof window === 'undefined') {
      return http(getFallbackRpcUrl(chainKey))(opts);
    }

    // In browser, use secure proxy
    return {
      config: {
        key: `secure-${chainKey}`,
        name: `Secure Transport for ${chainKey}`,
        request: async ({ method, params }: { method: string; params?: any }) => {
          try {
            const result = await secureRpcCall(chainKey, method, params || []);
            if (result.error) {
              throw new Error(result.error.message || 'RPC error');
            }
            return result.result;
          } catch (error) {
            console.error(`Secure RPC call failed for ${chainKey}:`, error);
            throw error;
          }
        },
        type: 'secure' as const
      },
      request: async ({ method, params }: { method: string; params?: any }) => {
        try {
          const result = await secureRpcCall(chainKey, method, params || []);
          if (result.error) {
            throw new Error(result.error.message || 'RPC error');
          }
          return result.result;
        } catch (error) {
          console.error(`Secure RPC call failed for ${chainKey}:`, error);
          throw error;
        }
      }
    };
  };
}

// Create secure Pimlico transport
export function createSecurePimlicoTransport(chainKey: string) {
  return (opts?: any) => {
    // During SSR, return a dummy transport to prevent errors
    if (typeof window === 'undefined') {
      return {
        config: {
          key: `secure-pimlico-${chainKey}`,
          name: `Secure Pimlico Transport for ${chainKey}`,
          request: async () => {
            throw new Error('Pimlico calls not available during SSR');
          },
          type: 'secure-pimlico' as const
        },
        request: async () => {
          throw new Error('Pimlico calls not available during SSR');
        }
      };
    }

    // In browser, use secure proxy
    return {
      config: {
        key: `secure-pimlico-${chainKey}`,
        name: `Secure Pimlico Transport for ${chainKey}`,
        request: async ({ method, params }: { method: string; params?: any }) => {
          try {
            const result = await securePimlicoCall(chainKey, method, params || []);
            if (result.error) {
              throw new Error(result.error.message || 'Pimlico error');
            }
            return result.result;
          } catch (error) {
            console.error(`Secure Pimlico call failed for ${chainKey}:`, error);
            throw error;
          }
        },
        type: 'secure-pimlico' as const
      },
      request: async ({ method, params }: { method: string; params?: any }) => {
        try {
          const result = await securePimlicoCall(chainKey, method, params || []);
          if (result.error) {
            throw new Error(result.error.message || 'Pimlico error');
          }
          return result.result;
        } catch (error) {
          console.error(`Secure Pimlico call failed for ${chainKey}:`, error);
          throw error;
        }
      }
    };
  };
}