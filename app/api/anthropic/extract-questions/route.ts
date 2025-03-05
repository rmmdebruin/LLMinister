import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript, apiKey } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
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

    // Extract questions using Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Extract all questions from the following parliamentary debate transcript. For each question, identify the text of the question. Return the result as a JSON array of objects with a "text" field for each question. Only include actual questions asked by parliament members.

Transcript:
${transcript}`
      }]
    });

    // Extract the content and parse the JSON
    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    const questions = JSON.parse(content);

    // Map to the expected format
    const formattedQuestions = questions.map((question: {text: string}) => ({
      text: question.text,
      status: 'Draft' as const
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error('Error extracting questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}