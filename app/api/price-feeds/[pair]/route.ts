import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pair: string }> }
) {
  try {
    // Get the Authorization header to forward to backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const { pair } = await params;
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair parameter required' }, { status: 400 });
    }

    // Make request to backend API with forwarded Authorization header
    const backendUrl = `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/price-feeds/${encodeURIComponent(pair)}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    console.error('Price feeds API error:', error);
    return NextResponse.json({ error: 'Price feeds API call failed' }, { status: 500 });
  }
} 