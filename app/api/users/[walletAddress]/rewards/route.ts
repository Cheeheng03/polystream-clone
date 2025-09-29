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
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Make request to backend API with forwarded Authorization header
    const backendUrl = `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/users/${walletAddress}/rewards`;
    
    const response = await fetch(backendUrl, {
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
    console.error('Get rewards API error:', error);
    return NextResponse.json({ error: 'Get rewards API call failed' }, { status: 500 });
  }
} 