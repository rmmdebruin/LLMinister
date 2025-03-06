import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { questionId, questionText, draftAnswer } = await request.json();

    if (!questionId || !questionText || draftAnswer === undefined) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Missing required fields: questionId, questionText, or draftAnswer'
        },
        { status: 400 }
      );
    }

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
    const mostRecentFileName = answersFiles[0].name;
    console.log(`Updating answer in file: ${mostRecentFile}`);

    const questions = JSON.parse(fs.readFileSync(mostRecentFile, 'utf-8'));

    // Find the question to update
    const questionIndex = questions.findIndex((q: any) =>
      q.question_text === questionText
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found in the file' },
        { status: 404 }
      );
    }

    // Update the draft answer
    questions[questionIndex].draftAnswer = draftAnswer;

    // Save the updated questions back to the same file
    fs.writeFileSync(mostRecentFile, JSON.stringify(questions, null, 2));
    console.log(`Updated answers saved to: ${mostRecentFile}`);

    return NextResponse.json({
      status: 'success',
      message: 'Answer updated successfully',
      file: mostRecentFileName
    });

  } catch (error: any) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: `Failed to save answer: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}