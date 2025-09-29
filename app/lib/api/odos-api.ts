// lib/api/odos-api.ts
import { SupportedChainKey, getChainConfig } from "../config/chains";
import { parseUnits, formatUnits } from "viem";

interface OdosQuoteRequest {
  chainId: number;
  inputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
  outputTokens: Array<{
    tokenAddress: string;
    proportion: number;
  }>;
  userAddr: string;
  slippageLimitPercent?: number;
  referralCode?: number;
}

interface OdosQuoteResponse {
  pathId: string;
  inTokens: string[];
  outTokens: string[];
  inAmounts: string[];
  outAmounts: string[];
  gasEstimate: number;
  gasEstimateValue: number;
  netOutValue: number;
  priceImpact: number;
  blockNumber: number;
}

interface OdosAssembleRequest {
  userAddr: string;
  pathId: string;
  simulate?: boolean;
}

interface OdosAssembleResponse {
  transaction: {
    gas: number;
    gasPrice: number;
    value: string;
    to: string;
    from: string;
    data: string;
    nonce: number;
    chainId: number;
  };
  inputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
  outputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
  netOutValue: number;
  simulation?: {
    isSuccess: boolean;
    amountsOut: number[];
    gasEstimate: number;
  };
}

class OdosAPI {
  private static instance: OdosAPI;
  private readonly BASE_URL = 'https://api.odos.xyz';
  
  // Supported tokens for swap (ETH, USDC, USDT)
  private readonly SUPPORTED_TOKENS = ['eth', 'usdc', 'usdt'];

  static getInstance(): OdosAPI {
    if (!OdosAPI.instance) {
      OdosAPI.instance = new OdosAPI();
    }
    return OdosAPI.instance;
  }

  // Get referral code for a specific chain
  private getReferralCode(chainKey: SupportedChainKey): number | undefined {
    const chainConfig = getChainConfig(chainKey);
    return chainConfig.odosReferralCode;
  }

  // Check if chain supports Odos swaps
  private chainSupportsSwaps(chainKey: SupportedChainKey): boolean {
    const chainConfig = getChainConfig(chainKey);
    return !!(chainConfig.odosReferralCode && chainConfig.odosRouterAddress);
  }

  // Get quote for token swap
  async getQuote(
    chainKey: SupportedChainKey,
    inputToken: string,
    outputToken: string,
    amount: string,
    userAddress: string,
    slippage: number = 0.5
  ): Promise<OdosQuoteResponse> {
    try {
      // Check if chain supports swaps
      if (!this.chainSupportsSwaps(chainKey)) {
        throw new Error(`Swaps not supported on ${chainKey}. Please register referral code first.`);
      }

      const chainConfig = getChainConfig(chainKey);
      const referralCode = this.getReferralCode(chainKey);
      
      // Get token addresses
      const inputTokenAddress = this.getTokenAddress(chainKey, inputToken);
      const outputTokenAddress = this.getTokenAddress(chainKey, outputToken);

      // Convert amount to wei (smallest unit) - this is the key fix!
      const amountInWei = this.convertToWei(amount, inputToken, chainKey);

      const requestBody: OdosQuoteRequest = {
        chainId: chainConfig.chain.id,
        inputTokens: [{
          tokenAddress: inputTokenAddress,
          amount: amountInWei // Send as wei string
        }],
        outputTokens: [{
          tokenAddress: outputTokenAddress,
          proportion: 1
        }],
        userAddr: userAddress,
        slippageLimitPercent: slippage,
        referralCode: referralCode // Chain-specific referral code
      };

      console.log(`🔄 Getting Odos quote for ${chainKey} with referral code ${referralCode}:`, requestBody);

      const response = await fetch(`${this.BASE_URL}/sor/quote/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Odos quote failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Odos quote received for ${chainKey}:`, data);
      
      return data;
    } catch (error) {
      console.error(`Error getting Odos quote for ${chainKey}:`, error);
      throw error;
    }
  }

  // Assemble transaction for execution
  async assembleTransaction(
    pathId: string,
    userAddress: string,
    simulate: boolean = true
  ): Promise<OdosAssembleResponse> {
    try {
      const requestBody: OdosAssembleRequest = {
        userAddr: userAddress,
        pathId: pathId,
        simulate: simulate
      };

      console.log('🔄 Assembling Odos transaction:', requestBody);

      const response = await fetch(`${this.BASE_URL}/sor/assemble`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Odos assemble failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Odos transaction assembled:', data);
      
      return data;
    } catch (error) {
      console.error('Error assembling Odos transaction:', error);
      throw error;
    }
  }

  // Get token address for a chain (supports ETH, USDC, USDT)
  private getTokenAddress(chainKey: SupportedChainKey, tokenSymbol: string): string {
    const tokenLower = tokenSymbol.toLowerCase();
    
    if (tokenLower === 'eth') {
      // ETH is represented as zero address in Odos
      return '0x0000000000000000000000000000000000000000';
    }
    
    const chainConfig = getChainConfig(chainKey);
    
    if (tokenLower === 'usdc') {
      return chainConfig.tokens.usdc;
    }
    
    if (tokenLower === 'usdt' && chainConfig.tokens.usdt) {
      return chainConfig.tokens.usdt;
    }
    
    throw new Error(`Token ${tokenSymbol} not supported on ${chainKey}`);
  }

  // Convert amount to wei format required by Odos
  private convertToWei(amount: string, tokenSymbol: string, chainKey: SupportedChainKey): string {
    const tokenLower = tokenSymbol.toLowerCase();
    let decimals: number;
    
    // Get decimals for each token type
    if (tokenLower === 'eth') {
      decimals = 18;
    } else if (tokenLower === 'usdc' || tokenLower === 'usdt') {
      decimals = 6;
    } else {
      throw new Error(`Unknown token decimals for ${tokenSymbol}`);
    }
    
    // Convert to wei using parseUnits from viem
    try {
      const amountInWei = parseUnits(amount, decimals);
      return amountInWei.toString();
    } catch (error) {
      throw new Error(`Failed to convert amount ${amount} for token ${tokenSymbol}: ${error}`);
    }
  }

  // Validate if swap is supported
  isSupportedSwap(inputToken: string, outputToken: string, chainKey: SupportedChainKey): boolean {
    const inputLower = inputToken.toLowerCase();
    const outputLower = outputToken.toLowerCase();
    
    // Check if chain supports swaps
    if (!this.chainSupportsSwaps(chainKey)) {
      return false;
    }
    
    // Check if both tokens are supported
    if (!this.SUPPORTED_TOKENS.includes(inputLower) || !this.SUPPORTED_TOKENS.includes(outputLower)) {
      return false;
    }
    
    // Can't swap same token
    if (inputLower === outputLower) {
      return false;
    }
    
    // Check if tokens are available on the chain
    try {
      this.getTokenAddress(chainKey, inputToken);
      this.getTokenAddress(chainKey, outputToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get supported tokens for a chain
  getSupportedTokens(chainKey: SupportedChainKey): string[] {
    // Only return tokens if chain supports swaps
    if (!this.chainSupportsSwaps(chainKey)) {
      return [];
    }
    
    const chainConfig = getChainConfig(chainKey);
    const supported = chainKey === 'polygon' ? ['USDC'] : ['ETH', 'USDC'];
    
    if (chainConfig.tokens.usdt) {
      supported.push('USDT');
    }
    
    return supported;
  }

  // Calculate minimum output amount with slippage
  calculateMinOutput(outputAmount: string, slippagePercent: number): string {
    const output = parseFloat(this.formatFromWeiPrivate(outputAmount, 'USDC')); // Convert from wei first
    const minOutput = output * (1 - slippagePercent / 100);
    return minOutput.toFixed(6);
  }

  // Calculate price impact display
  formatPriceImpact(priceImpact: number): string {
    if (priceImpact === null || priceImpact === undefined) return 'N/A';
    return `${(priceImpact * 100).toFixed(2)}%`;
  }

  // Calculate your fee revenue (80% of 0.375% = 0.3%)
  calculateYourFeeRevenue(inputAmount: string, inputToken: string): string {
    const amount = parseFloat(this.formatFromWeiPrivate(inputAmount, inputToken)); // Convert from wei first
    const yourFee = amount * 0.003; // 0.3%
    return yourFee.toFixed(6);
  }

  // Helper to format wei amounts back to readable format (public method)
  formatFromWei(amount: string, tokenSymbol: string): string {
    return this.formatFromWeiPrivate(amount, tokenSymbol);
  }

  // Helper to format wei amounts back to readable format
  private formatFromWeiPrivate(amount: string, tokenSymbol: string): string {
    const tokenLower = tokenSymbol.toLowerCase();
    let decimals: number;
    
    // Get decimals for each token type
    if (tokenLower === 'eth') {
      decimals = 18;
    } else if (tokenLower === 'usdc' || tokenLower === 'usdt') {
      decimals = 6;
    } else {
      throw new Error(`Unknown token decimals for ${tokenSymbol}`);
    }
    
    try {
      return formatUnits(BigInt(amount), decimals);
    } catch (error) {
      console.error(`Failed to format amount ${amount} for token ${tokenSymbol}:`, error);
      return "0";
    }
  }
}

export const odosAPI = OdosAPI.getInstance();