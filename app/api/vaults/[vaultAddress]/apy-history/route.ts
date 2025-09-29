import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vaultAddress: string }> }
) {
  try {
    // Get the Authorization header to forward to backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const { vaultAddress } = await params;
    
    if (!vaultAddress) {
      return NextResponse.json({ error: 'Vault address parameter required' }, { status: 400 });
    }

    // Make request to backend API with forwarded Authorization header
    const backendUrl = `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/vaults/${encodeURIComponent(vaultAddress)}/apy-history`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': authHeader, // Forward the Authorization header
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Vault APY history API error:', error);
    return NextResponse.json({ error: 'Vault APY history API call failed' }, { status: 500 });
  }
} 