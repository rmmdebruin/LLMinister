import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { QuestionController } from '../../../../backend/src/controllers/questionController';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, categories, transcriptFile } = await request.json();

    console.log('Received API Key for question extraction');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key is required' },
        { status: 400 }
      );
    }

    // Validate Anthropic API key format
    if (!apiKey.startsWith('sk-ant-')) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key format' },
        { status: 400 }
      );
    }

    // Get the absolute paths
    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');
    const transcriptsDir = path.join(dataDir, 'transcripts');
    const speakersListPath = path.join(dataDir, 'list_of_speakers', 'list_of_speakers.csv');

    // Initialize the controller
    const controller = new QuestionController(apiKey, dataDir);

    // Determine transcript path
    const transcriptPath = transcriptFile
      ? path.join(transcriptsDir, transcriptFile)
      : await findLatestTranscript(transcriptsDir);

    // Extract questions
    const { questions, outputPath } = await controller.extractQuestions(
      transcriptPath,
      categories,
      speakersListPath
    );

    return NextResponse.json({
      status: 'success',
      questions,
      message: 'Questions extracted successfully',
      outputPath
    });

  } catch (error) {
    console.error('Error in question extraction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function findLatestTranscript(transcriptsDir: string): Promise<string> {
  const { readdir } = await import('fs/promises');
  const fs = await import('fs');

  const files = await readdir(transcriptsDir);
  const transcriptFiles = files
    .filter(file => file.match(/.*_transcript_.*\.txt$/))
    .map(file => ({
      name: file,
      path: path.join(transcriptsDir, file),
      time: fs.statSync(path.join(transcriptsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (transcriptFiles.length === 0) {
    throw new Error('No transcript files found');
  }

  return transcriptFiles[0].path;
}