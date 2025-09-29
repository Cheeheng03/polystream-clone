import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chainKey, method, params } = await request.json();
    
    // Validate chain and get Pimlico URL
    const supportedChains = {
      scroll: 'https://api.pimlico.io/v2/scroll/rpc',
      base: 'https://api.pimlico.io/v2/base/rpc',
      scrollSepolia: 'https://api.pimlico.io/v2/scroll-sepolia-testnet/rpc',
      polygon: 'https://api.pimlico.io/v2/polygon/rpc',
      arbitrum: 'https://api.pimlico.io/v2/arbitrum/rpc',
      optimism: 'https://api.pimlico.io/v2/optimism/rpc'
    };

    const baseUrl = supportedChains[chainKey as keyof typeof supportedChains];
    if (!baseUrl) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    const apiKey = process.env.PIMLICO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Pimlico API key not configured' }, { status: 500 });
    }

    // Proxy the Pimlico call
    const response = await fetch(`${baseUrl}?apikey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Pimlico proxy error:', error);
    return NextResponse.json({ error: 'Pimlico call failed' }, { status: 500 });
  }
}

// Handle gas estimation requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainKey = searchParams.get('chain');

    if (!chainKey) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }

    const supportedChains = {
      scroll: 'https://api.pimlico.io/v2/scroll/rpc',
      base: 'https://api.pimlico.io/v2/base/rpc',
      scrollSepolia: 'https://api.pimlico.io/v2/scroll-sepolia-testnet/rpc',
      polygon: 'https://api.pimlico.io/v2/polygon/rpc',
      arbitrum: 'https://api.pimlico.io/v2/arbitrum/rpc',
      optimism: 'https://api.pimlico.io/v2/optimism/rpc'
    };

    const baseUrl = supportedChains[chainKey as keyof typeof supportedChains];
    if (!baseUrl) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    const apiKey = process.env.PIMLICO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Pimlico API key not configured' }, { status: 500 });
    }

    // Get gas prices
    const response = await fetch(`${baseUrl}?apikey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'pimlico_getUserOperationGasPrice',
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Pimlico gas price error:', error);
    return NextResponse.json({ error: 'Gas price fetch failed' }, { status: 500 });
  }
} 