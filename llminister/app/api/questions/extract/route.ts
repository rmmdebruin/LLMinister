import { statSync } from 'fs';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

async function saveTranscript(transcriptJson: string): Promise<string> {
  // Parse the JSON to get the timestamp and create a filename
  const transcript = JSON.parse(transcriptJson);
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')  // Remove dashes and colons
    .replace(/\..+/, '')   // Remove milliseconds
    .replace('T', '_');    // Replace T with underscore

  const filename = `${timestamp}_transcript.json`;

  // Ensure the transcripts directory exists
  const transcriptsDir = path.join(process.cwd(), '..', 'data', 'transcripts');
  await mkdir(transcriptsDir, { recursive: true });

  // Save the transcript
  const filepath = path.join(transcriptsDir, filename);
  await writeFile(filepath, transcriptJson);

  return filepath;
}

async function findLatestTranscript(): Promise<{ path: string; content: string }> {
  const transcriptsDir = path.join(process.cwd(), '..', 'data', 'transcripts');

  const files = await readdir(transcriptsDir);
  const transcriptFiles = files
    .filter(file => file.endsWith('_transcript.json'))
    .map(file => ({
      name: file,
      path: path.join(transcriptsDir, file),
      time: statSync(path.join(transcriptsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (transcriptFiles.length === 0) {
    throw new Error('No transcript files found');
  }

  const latestTranscript = transcriptFiles[0];
  const content = await readFile(latestTranscript.path, 'utf-8');

  return {
    path: latestTranscript.path,
    content: content
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the transcript and categories from the request
    const { transcript, categories } = await request.json();

    let transcriptPath: string;
    let transcriptContent: string;

    if (transcript) {
      // If transcript is provided, save it and use it
      transcriptPath = await saveTranscript(transcript);
      transcriptContent = transcript;
    } else {
      // If no transcript provided, use the latest one
      const latest = await findLatestTranscript();
      transcriptPath = latest.path;
      transcriptContent = latest.content;
    }

    // Parse the transcript to get the text
    const transcriptData = JSON.parse(transcriptContent);

    // Forward the request to our Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/questions/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
      },
      body: JSON.stringify({
        transcript_path: transcriptPath,
        transcript_text: transcriptData.text, // Also send the text directly
        categories: categories || ['Algemeen'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to extract questions: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error extracting questions:', error);
    return NextResponse.json(
      { error: 'Failed to extract questions' },
      { status: 500 }
    );
  }
}