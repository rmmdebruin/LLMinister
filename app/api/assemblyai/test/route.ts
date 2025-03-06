import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key by making a request to AssemblyAI's API
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: 'https://storage.googleapis.com/aai-web-samples/news.mp3',
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid API key or API request failed' },
        { status: response.status }
      );
    }

    // If we get here, the API key is valid
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing AssemblyAI API key:', error);
    return NextResponse.json(
      { error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}