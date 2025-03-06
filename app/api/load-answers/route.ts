import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the absolute paths
    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');
    const answersDir = path.join(dataDir, 'answers');

    // Ensure the answers directory exists
    if (!fs.existsSync(answersDir)) {
      return NextResponse.json(
        { error: 'Answers directory not found' },
        { status: 404 }
      );
    }

    // Find the most recent questions_with_answers file
    const answersFiles = fs.readdirSync(answersDir)
      .filter(file => file.startsWith('questions_with_answers_'))
      .map(file => ({
        name: file,
        path: path.join(answersDir, file),
        time: fs.statSync(path.join(answersDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (answersFiles.length === 0) {
      return NextResponse.json(
        { error: 'No questions with answers file found' },
        { status: 404 }
      );
    }

    // Read the most recent file
    const mostRecentFile = answersFiles[0].path;
    console.log(`Loading questions with answers from: ${mostRecentFile}`);

    const questions = JSON.parse(fs.readFileSync(mostRecentFile, 'utf-8'));

    return NextResponse.json({
      status: 'success',
      questions: questions,
      message: 'Questions with answers loaded successfully',
      file: path.basename(mostRecentFile)
    });

  } catch (error: any) {
    console.error('Error loading questions with answers:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: `Failed to load questions with answers: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}