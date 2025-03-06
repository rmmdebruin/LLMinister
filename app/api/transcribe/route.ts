import { exec } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
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
    const tempFilePath = path.join(tempDir, `debate_video_trimmed${fileExt}`);

    // Convert File to Buffer and write to temp file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // Get the absolute paths
    const projectRoot = path.resolve(process.cwd());
    const pythonScriptPath = path.join(projectRoot, 'backend', 'transcribe.py');
    const venvPath = path.join(projectRoot, 'backend', 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const dataDir = path.join(projectRoot, '..', 'data');
    const debateVideosDir = path.join(dataDir, 'debate_videos');

    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Ensure the debate_videos directory exists
    if (!fs.existsSync(debateVideosDir)) {
      fs.mkdirSync(debateVideosDir, { recursive: true });
    }

    // Save a copy of the uploaded file to the debate_videos directory
    const savedFilePath = path.join(debateVideosDir, file.name);
    fs.writeFileSync(savedFilePath, buffer);
    console.log(`Saved uploaded file to: ${savedFilePath}`);

    // Build and execute the command
    const command = `cd "${path.join(projectRoot, 'backend')}" && source venv/bin/activate && "${pythonPath}" "${pythonScriptPath}" --api-key "${apiKey}" --input "${tempFilePath}" --output-dir "${dataDir}"`;

    console.log('Executing command:', command);

    const { stdout, stderr } = await execAsync(command);

    console.log('Command output:', stdout);
    if (stderr) console.error('Command stderr:', stderr);

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    // Parse the output to get the transcript path
    const outputLines = stdout.split('\n');
    const transcriptLine = outputLines.find(line => line.includes('Output saved to:'));

    if (!transcriptLine) {
      throw new Error('Could not find transcript in output');
    }

    const transcriptPath = transcriptLine.split('Output saved to:')[1].trim();
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');

    return NextResponse.json({
      status: 'success',
      transcript: transcript
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: `Transcription failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}