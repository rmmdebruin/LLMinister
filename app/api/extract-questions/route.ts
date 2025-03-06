import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Function to execute shell commands
function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error}`);
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
    // Get the request data
    const { apiKey, categories, transcriptFile } = await request.json();

    // Validate required fields
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key is required' },
        { status: 400 }
      );
    }

    // Get the path to the Python script
    const scriptDir = path.resolve(process.cwd(), 'backend');
    const scriptPath = path.join(scriptDir, 'extract_questions.sh');
    const dataDir = path.resolve(process.cwd(), '..', 'data');
    const questionsDir = path.join(dataDir, 'questions');

    console.log(`Script directory: ${scriptDir}`);
    console.log(`Script path: ${scriptPath}`);
    console.log(`Data directory: ${dataDir}`);
    console.log(`Questions directory: ${questionsDir}`);

    // Check if the script exists
    try {
      await fs.access(scriptPath);
    } catch (error) {
      console.error(`Script not found at ${scriptPath}`);
      return NextResponse.json(
        { error: `Script not found at ${scriptPath}` },
        { status: 500 }
      );
    }

    // Ensure the questions directory exists
    await fs.mkdir(questionsDir, { recursive: true }).catch(() => {});

    // Build the command
    let command = `cd ${scriptDir} && ANTHROPIC_API_KEY="${apiKey}" ./extract_questions.sh`;

    // Add categories if provided
    if (categories && categories.length > 0) {
      command += ` --categories "${categories.join(' ')}"`;
    }

    // Add transcript file if provided
    if (transcriptFile) {
      command += ` --transcript-file "${transcriptFile}"`;
    }

    console.log(`Executing command: ${command.replace(apiKey, '***API_KEY***')}`);

    try {
      // Execute the command
      const output = await executeCommand(command);
      console.log('Question extraction output:', output);

      // Parse the output to find the JSON file path
      const jsonPathMatch = output.match(/JSON output: (.+\.json)/);
      const jsonPath = jsonPathMatch ? jsonPathMatch[1] : null;

      if (jsonPath && await fs.stat(jsonPath).catch(() => false)) {
        // Read the JSON file
        const questionsData = await fs.readFile(jsonPath, 'utf-8');
        const questions = JSON.parse(questionsData);

        return NextResponse.json({
          status: 'success',
          questions,
          message: 'Questions extracted successfully'
        });
      } else {
        // Try to find the most recent questions file
        console.log(`JSON path not found in output. Checking questions directory: ${questionsDir}`);

        try {
          // List files in the questions directory
          const files = await fs.readdir(questionsDir);

          // Find the most recent JSON file
          const jsonFiles = files.filter(f => f.endsWith('.json'));

          if (jsonFiles.length > 0) {
            // Sort by modification time (most recent first)
            const fileStats = await Promise.all(
              jsonFiles.map(async (file) => {
                const filePath = path.join(questionsDir, file);
                const stats = await fs.stat(filePath);
                return { file, stats };
              })
            );

            fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

            const mostRecentFile = fileStats[0].file;
            const mostRecentPath = path.join(questionsDir, mostRecentFile);

            console.log(`Found most recent questions file: ${mostRecentPath}`);

            // Read the JSON file
            const questionsData = await fs.readFile(mostRecentPath, 'utf-8');
            const questions = JSON.parse(questionsData);

            return NextResponse.json({
              status: 'success',
              questions,
              message: 'Questions extracted successfully (found in questions directory)'
            });
          }
        } catch (error) {
          console.error('Error finding questions in questions directory:', error);
        }

        throw new Error('Questions file not found in output or questions directory');
      }
    } catch (error) {
      console.error('Error executing Python script:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in question extraction process:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}