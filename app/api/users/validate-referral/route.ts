import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header to forward to backend
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    
    if (!body.referral_code) {
      return NextResponse.json({ error: 'referral_code is required' }, { status: 400 });
    }

    // Make request to backend API with forwarded Authorization header
    const backendUrl = `${process.env.NEXT_PUBLIC_TRACKER_API_URL}/users/validate-referral`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader, // Forward the Authorization header
      },
      body: JSON.stringify({ referral_code: body.referral_code }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API request failed: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: 'Backend API request failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Validate referral API error:', error);
    return NextResponse.json({ error: 'Validate referral API call failed' }, { status: 500 });
  }
} 