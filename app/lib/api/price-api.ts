"use client";

import { usePrivy } from "@privy-io/react-auth";

class PriceAPI {
  private static instance: PriceAPI;
  private readonly baseUrl = '/api/price-feeds';
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly cacheTimeout = 60000; // 1 minute cache
  private getAccessToken: (() => Promise<string>) | null = null;

  static getInstance(): PriceAPI {
    if (!PriceAPI.instance) {
      PriceAPI.instance = new PriceAPI();
    }
    return PriceAPI.instance;
  }

  // Set the access token getter function (called from React components)
  setAccessTokenGetter(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
  }

  // Get price for a specific pair (e.g., "ETH/USD", "USDT/USD")
  async getPrice(pair: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache.get(pair);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.price;
      }

      if (!this.getAccessToken) {
        throw new Error('Access token getter not set. Call setAccessTokenGetter first.');
      }

      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(pair)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${pair}: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.price) {
        throw new Error(`Invalid price data for ${pair}`);
      }

      const price = data.data.price;
      
      // Cache the result
      this.priceCache.set(pair, { price, timestamp: Date.now() });
      
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${pair}:`, error);
      
      // Return cached price if available, otherwise return 0
      const cached = this.priceCache.get(pair);
      if (cached) {
        console.warn(`Using cached price for ${pair}: ${cached.price}`);
        return cached.price;
      }
      
      return 0;
    }
  }

  // Get multiple prices at once
  async getPrices(pairs: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    
    // Fetch all prices in parallel
    const promises = pairs.map(async (pair) => {
      const price = await this.getPrice(pair);
      results[pair] = price;
    });

    await Promise.allSettled(promises);
    
    return results;
  }

  // Convert token amount to USD
  async convertToUSD(tokenSymbol: string, amount: string | number): Promise<number> {
    const pair = `${tokenSymbol.toUpperCase()}/USD`;
    const price = await this.getPrice(pair);
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return numAmount * price;
  }

  // Clear cache (useful for testing or force refresh)
  clearCache(): void {
    this.priceCache.clear();
  }
}

export const priceAPI = PriceAPI.getInstance(); 