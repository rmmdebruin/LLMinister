import { exec } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

function generatePythonScript(projectRoot: string, dataDir: string, tempFilePath: string, apiKey: string, fileName: string): string {
  return `
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.join('${projectRoot}', 'backend', 'src')
sys.path.append(backend_dir)

try:
    from backend.src.controllers.transcription_controller import TranscriptionController
    import json

    # Initialize controller
    controller = TranscriptionController('${apiKey}', '${dataDir}')

    # Process video
    with open('${tempFilePath}', 'rb') as f:
        result = controller.process_video(f.read(), '${fileName}')

    # Print result
    print('TRANSCRIPTION_RESULT:', json.dumps(result))

except ImportError as e:
    print('TRANSCRIPTION_ERROR: Failed to import required modules. Error: ' + str(e))
    sys.exit(1)
except Exception as e:
    print('TRANSCRIPTION_ERROR: ' + str(e))
    sys.exit(1)
`;
}

export async function POST(request: NextRequest) {
  let tempFilePath = '';
  let scriptPath = '';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: 'Missing file or API key' },
        { status: 400 }
      );
    }

    // Create a temporary file
    const tempDir = os.tmpdir();
    const fileExt = path.extname(file.name);
    tempFilePath = path.join(tempDir, `debate_video_${Date.now()}${fileExt}`);

    // Convert File to Buffer and write to temp file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // Get the absolute paths
    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');

    // Ensure data directories exist
    const videosDir = path.join(dataDir, 'debate_videos');
    const transcriptsDir = path.join(dataDir, 'transcripts');
    fs.mkdirSync(videosDir, { recursive: true });
    fs.mkdirSync(transcriptsDir, { recursive: true });

    // Generate Python script
    const pythonScript = generatePythonScript(projectRoot, dataDir, tempFilePath, apiKey, file.name);

    // Save Python script to temp file
    scriptPath = path.join(tempDir, `transcribe_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, pythonScript);

    console.log('Executing Python script:', scriptPath);
    console.log('Video file path:', tempFilePath);

    // Execute Python script with system Python
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    // Clean up temporary files
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }

    // Check for errors in output
    if (stdout.includes('TRANSCRIPTION_ERROR:')) {
      const error = stdout.split('TRANSCRIPTION_ERROR:')[1].trim();
      throw new Error(error);
    }

    // Parse the output to get the transcription result
    const resultLine = stdout.split('\n').find(line => line.startsWith('TRANSCRIPTION_RESULT:'));

    if (!resultLine) {
      throw new Error('Could not find transcription result in output');
    }

    const result = JSON.parse(resultLine.replace('TRANSCRIPTION_RESULT:', ''));

    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    if (result.status === 'success') {
      // Automatically trigger question extraction using the Anthropic API key
      const anthropicApiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

      if (!anthropicApiKey) {
        console.error('Anthropic API key not found in environment variables');
        return NextResponse.json(result);
      }

      console.log('Using Anthropic API Key for extraction');

      const extractResponse = await fetch(`${baseUrl}/api/questions/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: anthropicApiKey,
          transcript: result.transcript
        }),
      });

      if (!extractResponse.ok) {
        console.error('Failed to extract questions:', await extractResponse.text());
      } else {
        const extractResult = await extractResponse.json();
        result.questions = extractResult.questions;
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    // Clean up temporary files in case of error
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (scriptPath && fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }

    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error: `Transcription failed: ${error?.message || 'Unknown error'}`,
        details: error?.stack
      },
      { status: 500 }
    );
  }
}