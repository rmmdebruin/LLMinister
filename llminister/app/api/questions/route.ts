import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { questionId, update, apiKey } = await request.json();

    if (!questionId || !update || !apiKey) {
      return NextResponse.json(
        { error: 'Question ID, update data, and API key are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}/questions/${questionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Support both URL parameters and JSON body
    let questionId: string | null = null;
    let questionText: string | null = null;
    let apiKey: string | null = null;

    // Try to get parameters from URL first
    const { searchParams } = new URL(request.url);
    questionId = searchParams.get('id');
    questionText = searchParams.get('text');
    apiKey = searchParams.get('apiKey');

    // If not in URL params, try to get from request body
    if (!questionId && !questionText) {
      try {
        const body = await request.json();
        questionId = body.questionId || null;
        questionText = body.questionText || null;
        apiKey = body.apiKey || apiKey;
      } catch (e) {
        // Ignore JSON parsing errors as the body might be empty
      }
    }

    if ((!questionId && !questionText) || !apiKey) {
      return NextResponse.json(
        { error: 'Either Question ID or Question Text, and API key are required' },
        { status: 400 }
      );
    }

    // Construct query parameters
    const queryParams = new URLSearchParams();
    if (questionId) queryParams.append('id', questionId);
    if (questionText) queryParams.append('text', questionText);

    const response = await fetch(`${PYTHON_BACKEND_URL}/questions?${queryParams}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}