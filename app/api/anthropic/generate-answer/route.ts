import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, apiKey } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key is required' },
        { status: 400 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Generate answer using Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Generate a draft answer for the following parliamentary question. The answer should be formal, factual, and comprehensive.

Question: ${question}

Please provide the answer in Dutch.`
      }]
    });

    // Extract the content
    const answer = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error generating answer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}