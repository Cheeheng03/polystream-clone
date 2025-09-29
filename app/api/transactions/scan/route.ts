import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');
    const token = searchParams.get('token') || 'usdc'; // Default to USDC for backward compatibility
    const startblock = searchParams.get('startblock') || '0';
    const endblock = searchParams.get('endblock') || '99999999';
    const action = searchParams.get('action') || 'tokentx'; // Default to token transfers
    
    if (!chain || !address) {
      return NextResponse.json({ error: 'Chain and address parameters required' }, { status: 400 });
    }

    let apiUrl: string;
    let apiKey: string | undefined;
    let contractAddress: string | undefined;
    let bridgedUSDC: string | undefined;

    // Define token addresses for each chain
    const tokenAddresses: { [chain: string]: { [token: string]: string } } = {
      scroll: {
        usdc: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', // bridged USDC on Scroll (USDC.e)
        usdt: '0xf55bec9cafdbe8730f096aa55dad6d22d44099df', // USDT on Scroll
        weth: '0x5300000000000000000000000000000000000004' // WETH on Scroll
      },
      base: {
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        usdt: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // USDT on Base
        weth: '0x4200000000000000000000000000000000000006' // WETH on Base
      },
      polygon: {
        usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC on Polygon
        usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
        weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
        bridgedusdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // bridged USDC on Polygon (USDC.e)
      },
      arbitrum: {
        usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Native USDC on Arbitrum
        usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
        weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
        bridgedusdc: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' // bridged USDC on Arbitrum (USDC.e)
      },
      optimism: {
        usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Native USDC on Optimism
        usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT on Optimism
        weth: '0x4200000000000000000000000000000000000006', // WETH on Optimism
        bridgedusdc: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' // bridged USDC on Optimism (USDC.e)
      }
    };

    switch (chain) {
      case 'scroll':
        apiUrl = 'https://api.scrollscan.com/api';
        apiKey = process.env.SCROLLSCAN_API_KEY;
        contractAddress = tokenAddresses.scroll[token.toLowerCase()];
        break;
      case 'base':
        apiUrl = 'https://api.basescan.org/api';
        apiKey = process.env.BASESCAN_API_KEY;
        contractAddress = tokenAddresses.base[token.toLowerCase()];
        break;
      case 'polygon':
        apiUrl = 'https://api.polygonscan.com/api';
        apiKey = process.env.POLYGONSCAN_API_KEY;
        contractAddress = tokenAddresses.polygon[token.toLowerCase()];
        bridgedUSDC = tokenAddresses.polygon.bridgedusdc; // Keep this for potential dual fetching
        break;
      case 'arbitrum':
        apiUrl = 'https://api.arbiscan.io/api';
        apiKey = process.env.ARBISCAN_API_KEY;
        contractAddress = tokenAddresses.arbitrum[token.toLowerCase()];
        bridgedUSDC = tokenAddresses.arbitrum.bridgedusdc; // Keep this for potential dual fetching
        break;
      case 'optimism':
        apiUrl = 'https://api-optimistic.etherscan.io/api';
        apiKey = process.env.OPTIMISTIC_API_KEY;
        contractAddress = tokenAddresses.optimism[token.toLowerCase()];
        bridgedUSDC = tokenAddresses.optimism.bridgedusdc; // Keep this for potential dual fetching
        break;
      default:
        return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: `${chain} API key not configured` }, { status: 500 });
    }

    if (!contractAddress) {
      return NextResponse.json({ error: `Token ${token} not supported on ${chain}` }, { status: 400 });
    }

    // Build the explorer API URL
    const explorerUrl = new URL(apiUrl);
    explorerUrl.searchParams.set('module', 'account');
    explorerUrl.searchParams.set('action', action);
    explorerUrl.searchParams.set('address', address);
    
    // For token transfers, add contract address filter
    if (action === 'tokentx' && contractAddress) {
      explorerUrl.searchParams.set('contractaddress', contractAddress);
    }
    
    explorerUrl.searchParams.set('startblock', startblock);
    explorerUrl.searchParams.set('endblock', endblock);
    explorerUrl.searchParams.set('sort', 'desc');
    explorerUrl.searchParams.set('apikey', apiKey);

    const response = await fetch(explorerUrl.toString());
    const data = await response.json();
        
    return NextResponse.json(data);
  } catch (error) {
    console.error('Blockchain explorer API error:', error);
    return NextResponse.json({ error: 'Explorer API call failed' }, { status: 500 });
  }
} 