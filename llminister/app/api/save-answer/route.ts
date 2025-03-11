import fs from 'fs';
import { glob } from 'glob';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { questionId, questionText, newQuestionText, draftAnswer } = await request.json();

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
    const questionsDir = path.join(dataDir, 'questions');

    // Ensure the answers directory exists
    if (!fs.existsSync(answersDir)) {
      fs.mkdirSync(answersDir, { recursive: true });
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

    let answersFilePath;
    let questions;

    if (answersFiles.length === 0) {
      // Create a new answers file if none exists
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const newFileName = `questions_with_answers_${timestamp}.json`;
      answersFilePath = path.join(answersDir, newFileName);
      questions = [];
    } else {
      // Use the most recent file
      answersFilePath = answersFiles[0].path;
      questions = JSON.parse(fs.readFileSync(answersFilePath, 'utf-8'));
    }

    // Find the question to update
    const questionIndex = questions.findIndex((q: any) =>
      q.question_text === questionText || q.text === questionText
    );

    if (questionIndex !== -1) {
      // Update the existing question
      questions[questionIndex].draftAnswer = draftAnswer;

      // Update the question text if it has changed
      if (newQuestionText && newQuestionText !== questionText) {
        questions[questionIndex].question_text = newQuestionText;
        questions[questionIndex].text = newQuestionText;
      }
    } else {
      // Add as a new question
      questions.push({
        id: questionId,
        question_text: newQuestionText || questionText,
        text: newQuestionText || questionText,
        draftAnswer: draftAnswer,
        timestamp: Date.now()
      });
    }

    // Save the updated questions to the answers file
    fs.writeFileSync(answersFilePath, JSON.stringify(questions, null, 2));
    console.log(`Updated answers saved to: ${answersFilePath}`);

    // Also update the question text in the original questions files if it has changed
    if (newQuestionText && newQuestionText !== questionText) {
      // Find all question files
      const questionFiles = glob.sync(path.join(questionsDir, '*.json'));

      // Sort by modification time (most recent first)
      const fileStats = questionFiles.map(filePath => ({
        filePath,
        time: fs.statSync(filePath).mtime.getTime()
      }));
      fileStats.sort((a, b) => b.time - a.time);

      // Process each question file to find and update the question
      let questionUpdated = false;

      for (const { filePath } of fileStats) {
        try {
          // Read the file
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const fileQuestions = JSON.parse(fileContent);

          // Find the question by text
          const fileQuestionIndex = fileQuestions.findIndex((q: any) =>
            q.question_text === questionText || q.text === questionText
          );

          if (fileQuestionIndex !== -1) {
            // Update the question text
            fileQuestions[fileQuestionIndex].question_text = newQuestionText;
            if (fileQuestions[fileQuestionIndex].text) {
              fileQuestions[fileQuestionIndex].text = newQuestionText;
            }

            // Write the updated questions back to the file
            fs.writeFileSync(filePath, JSON.stringify(fileQuestions, null, 2));

            console.log(`Question text updated in ${filePath}`);
            questionUpdated = true;

            // No need to check other files
            break;
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
          // Continue with other files
        }
      }

      if (!questionUpdated) {
        console.log(`Could not find original question to update text in questions directory`);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Answer updated successfully',
      file: path.basename(answersFilePath)
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