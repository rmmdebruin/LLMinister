import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const UPLOAD_TIMEOUT = 10 * 60 * 1000; // 10 minutes timeout for large files
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

export const config = {
  api: {
    bodyParser: false,
  },
};

async function saveTranscript(transcript: string): Promise<string> {
  // Create timestamp for unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `transcript_${timestamp}.txt`;

  // Ensure the transcripts directory exists
  const transcriptsDir = path.join(process.cwd(), '..', 'data', 'transcripts');
  await mkdir(transcriptsDir, { recursive: true });

  // Save the transcript
  const filepath = path.join(transcriptsDir, filename);
  await writeFile(filepath, transcript);

  return filepath;
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

  try {
    const contentType = request.headers.get('content-type');

    // Handle JSON request for saving transcript
    if (contentType?.includes('application/json')) {
      const { transcript } = await request.json();
      if (!transcript) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Missing transcript in request body'
          },
          { status: 400 }
        );
      }

      const transcriptPath = await saveTranscript(transcript);
      console.log('Saved transcript to:', transcriptPath);

      return NextResponse.json({
        status: 'success',
        transcriptPath: transcriptPath
      });
    }

    // Handle multipart form data for video file upload
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Request must be multipart/form-data or application/json'
        },
        { status: 400 }
      );
    }

    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing API key in headers'
        },
        { status: 400 }
      );
    }

    // Check content length for file uploads
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          status: 'error',
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing file'
        },
        { status: 400 }
      );
    }

    // Verify file size after getting the file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          status: 'error',
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 413 }
      );
    }

    // Create form data for the Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    // Send request to Python backend with timeout
    console.log('Starting transcription...');
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: backendFormData,
      signal: controller.signal,
    });

    let result;
    if (!response.ok) {
      let errorDetail: string;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || `HTTP error! status: ${response.status}`;
      } catch (e) {
        // If response is not JSON, use text content or status
        errorDetail = await response.text().catch(() => `HTTP error! status: ${response.status}`);
      }
      throw new Error(errorDetail);
    }

    result = await response.json();

    if (result.status !== 'success') {
      throw new Error(result.error || 'Transcription failed');
    }

    // Save the transcript to a file
    const transcriptPath = await saveTranscript(result.transcript);
    console.log('Saved transcript to:', transcriptPath);

    return NextResponse.json({
      status: 'success',
      transcript: result.transcript,
      transcriptPath: transcriptPath
    });
  } catch (error) {
    console.error('Error in transcription:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: error instanceof Error && error.message.includes('aborted') ? 408 : 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}