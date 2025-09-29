import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chainKey, method, params } = await request.json();
    
    // Validate chain
    const supportedChains = {
      scroll: `https://scroll-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      base: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      scrollSepolia: 'https://sepolia-rpc.scroll.io/',
      polygon: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      optimism: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    };

    const rpcUrl = supportedChains[chainKey as keyof typeof supportedChains];
    if (!rpcUrl) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    // Proxy the RPC call
    const response = await fetch(rpcUrl, {
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
    console.error('RPC proxy error:', error);
    return NextResponse.json({ error: 'RPC call failed' }, { status: 500 });
  }
} 