import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';

// Function to execute shell commands
function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        console.error(`Command stderr: ${stderr}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Command stderr (non-fatal): ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AssemblyAI API key is required' },
        { status: 400 }
      );
    }

    // Create a temporary file to store the uploaded video
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);

    console.log(`Saving uploaded file to: ${tempFilePath}`);

    // Write the file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);

    // Verify the file was written correctly
    const fileStats = await fs.stat(tempFilePath);
    console.log(`File saved successfully. Size: ${fileStats.size} bytes`);

    // Get the path to the Python script
    const scriptDir = path.resolve(process.cwd(), 'python');
    const pythonScript = path.join(scriptDir, 'transcribe.py');
    const dataDir = path.resolve(process.cwd(), '..', 'data');
    const transcriptsDir = path.join(dataDir, 'transcripts');

    console.log(`Script directory: ${scriptDir}`);
    console.log(`Python script: ${pythonScript}`);
    console.log(`Data directory: ${dataDir}`);
    console.log(`Transcripts directory: ${transcriptsDir}`);

    // Create a virtual environment if it doesn't exist and install dependencies
    try {
      if (!(await fs.stat(path.join(scriptDir, 'venv')).catch(() => false))) {
        console.log('Creating virtual environment...');
        await executeCommand(`cd ${scriptDir} && python3 -m venv venv`);
        await executeCommand(`cd ${scriptDir} && source venv/bin/activate && pip install -r requirements.txt`);
      }
    } catch (error) {
      console.error('Error setting up virtual environment:', error);
    }

    // Execute the Python script with absolute paths
    const command = `cd ${scriptDir} && source venv/bin/activate && python transcribe.py --api-key "${apiKey}" --input "${tempFilePath}" --output-dir "${dataDir}"`;

    console.log(`Executing command: ${command.replace(apiKey, '***API_KEY***')}`);

    try {
      const output = await executeCommand(command);
      console.log('Transcription output:', output);

      // Parse the output to find the transcript path
      const transcriptPathMatch = output.match(/Output saved to: (.+\.txt)/);
      const transcriptPath = transcriptPathMatch ? transcriptPathMatch[1] : null;

      if (transcriptPath && await fs.stat(transcriptPath).catch(() => false)) {
        // Read the transcript file
        const transcript = await fs.readFile(transcriptPath, 'utf-8');

        // Clean up the temporary file
        await fs.unlink(tempFilePath).catch(error => {
          console.error('Error deleting temporary file:', error);
        });

        return NextResponse.json({
          status: 'success',
          transcript,
          message: 'Transcription completed successfully',
          transcriptPath: transcriptPath
        });
      } else {
        // Try to find the transcript in the transcripts directory
        console.log(`Transcript path not found in output. Checking transcripts directory: ${transcriptsDir}`);

        try {
          // Ensure the transcripts directory exists
          await fs.mkdir(transcriptsDir, { recursive: true }).catch(() => {});

          // List files in the transcripts directory
          const files = await fs.readdir(transcriptsDir);

          // Find the most recent transcript file
          const transcriptFiles = files.filter(f => f.endsWith('_transcript_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.txt') ||
                                                f.includes('_transcript_') && f.endsWith('.txt'));

          if (transcriptFiles.length > 0) {
            // Sort by modification time (most recent first)
            const fileStats = await Promise.all(
              transcriptFiles.map(async (file) => {
                const filePath = path.join(transcriptsDir, file);
                const stats = await fs.stat(filePath);
                return { file, stats };
              })
            );

            fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

            const mostRecentFile = fileStats[0].file;
            const mostRecentPath = path.join(transcriptsDir, mostRecentFile);

            console.log(`Found most recent transcript file: ${mostRecentPath}`);

            // Read the transcript file
            const transcript = await fs.readFile(mostRecentPath, 'utf-8');

            // Clean up the temporary file
            await fs.unlink(tempFilePath).catch(error => {
              console.error('Error deleting temporary file:', error);
            });

            return NextResponse.json({
              status: 'success',
              transcript,
              message: 'Transcription completed successfully (found in transcripts directory)',
              transcriptPath: mostRecentPath
            });
          }
        } catch (error) {
          console.error('Error finding transcript in transcripts directory:', error);
        }

        throw new Error('Transcript file not found in output or transcripts directory');
      }
    } catch (error) {
      console.error('Error executing Python script:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in transcription process:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}