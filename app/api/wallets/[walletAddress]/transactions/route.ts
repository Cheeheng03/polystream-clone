import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    // Get the Authorization header to forward to backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const { walletAddress } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get query parameters
    const pageSize = searchParams.get('page_size') || '10';
    const pageNumber = searchParams.get('page_number') || '1';

    // Build backend API URL with query parameters
    const backendUrl = new URL(`${process.env.NEXT_PUBLIC_TRACKER_API_URL}/wallets/${walletAddress}/transactions`);
    backendUrl.searchParams.set('page_size', pageSize);
    backendUrl.searchParams.set('page_number', pageNumber);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader, // Forward the Authorization header
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API request failed: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: 'Backend API request failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Get wallet transactions API error:', error);
    return NextResponse.json({ error: 'Get wallet transactions API call failed' }, { status: 500 });
  }
} 