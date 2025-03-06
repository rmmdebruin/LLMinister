import { exec } from 'child_process';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Get the absolute paths
    const projectRoot = path.resolve(process.cwd());
    const pythonScriptPath = path.join(projectRoot, 'backend', 'generate_answers.py');
    const venvPath = path.join(projectRoot, 'backend', 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const dataDir = path.join(projectRoot, '..', 'data');
    const knowledgeDir = path.join(dataDir, 'available_knowledge');
    const questionsDir = path.join(dataDir, 'questions');
    const answersDir = path.join(dataDir, 'answers');

    // Ensure the questions directory exists
    if (!fs.existsSync(questionsDir)) {
      fs.mkdirSync(questionsDir, { recursive: true });
    }

    // Ensure the answers directory exists
    if (!fs.existsSync(answersDir)) {
      fs.mkdirSync(answersDir, { recursive: true });
    }

    // Get the most recent questions file
    const questionsFiles = fs.readdirSync(questionsDir)
      .filter(file => file.endsWith('.json') && !file.startsWith('questions_with_answers_'))
      .map(file => ({
        name: file,
        path: path.join(questionsDir, file),
        time: fs.statSync(path.join(questionsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (questionsFiles.length === 0) {
      return NextResponse.json(
        { error: 'No questions file found' },
        { status: 404 }
      );
    }

    const questionsFile = questionsFiles[0].path;

    // Create a timestamp in the format YYYYMMDD_HHMMSS (matching Python's format)
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const outputFile = path.join(answersDir, `questions_with_answers_${timestamp}.json`);

    // Build and execute the command
    const command = `cd "${path.join(projectRoot, 'backend')}" && source venv/bin/activate && "${pythonPath}" "${pythonScriptPath}" --questions-file "${questionsFile}" --knowledge-dir "${knowledgeDir}" --output-file "${outputFile}"`;

    console.log('Executing command:', command);

    const { stdout, stderr } = await execAsync(command);

    console.log('Command output:', stdout);
    if (stderr) console.error('Command stderr:', stderr);

    // Wait a short moment to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Try to extract the actual output file path from the command output
      const outputFileMatch = stdout.match(/Updated questions saved to (.+\.json)/);
      const actualOutputFile = outputFileMatch ? outputFileMatch[1] : outputFile;

      // Check if the actual output file exists
      if (!fs.existsSync(actualOutputFile)) {
        // If the actual output file doesn't exist, check if the original output file exists
        if (fs.existsSync(outputFile)) {
          console.log(`Using original output file: ${outputFile}`);
        } else {
          throw new Error(`Generated answers file not found at ${actualOutputFile} or ${outputFile}`);
        }
      } else {
        console.log(`Using actual output file found in command output: ${actualOutputFile}`);
      }

      // Read the generated answers file (use actualOutputFile if it exists, otherwise use outputFile)
      const fileToRead = fs.existsSync(actualOutputFile) ? actualOutputFile : outputFile;
      const fileContent = fs.readFileSync(fileToRead, 'utf-8');
      let answers;

      try {
        answers = JSON.parse(fileContent);
      } catch (parseError: any) {
        throw new Error(`Failed to parse answers file: ${parseError.message}`);
      }

      if (!Array.isArray(answers)) {
        throw new Error('Generated answers file does not contain an array of questions');
      }

      // Ensure each answer has the correct structure
      const processedAnswers = answers.map(answer => ({
        ...answer,
        id: answer.id || Math.random().toString(36).substring(7),
        text: answer.question_text || answer.text,
        question_text: answer.question_text || answer.text,
        status: answer.status || 'Draft',
        timestamp: answer.timestamp || Date.now(),
        // Ensure draftAnswer is always present
        draftAnswer: answer.draftAnswer
      }));

      return NextResponse.json({
        status: 'success',
        answers: processedAnswers,
        message: 'Draft answers generated successfully',
        outputFile: fileToRead
      });

    } catch (error: any) {
      console.error('Error reading generated answers:', error);

      // Fallback: try to find the most recent answers file
      try {
        const answersFiles = fs.readdirSync(answersDir)
          .filter(file => file.startsWith('questions_with_answers_') && file.endsWith('.json'))
          .map(file => ({
            name: file,
            path: path.join(answersDir, file),
            time: fs.statSync(path.join(answersDir, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);

        if (answersFiles.length === 0) {
          throw new Error('No answers file found');
        }

        // Use the most recent answers file
        const mostRecentAnswersFile = answersFiles[0].path;
        console.log(`Using most recent answers file as fallback: ${mostRecentAnswersFile}`);

        const fileContent = fs.readFileSync(mostRecentAnswersFile, 'utf-8');
        let answers;

        try {
          answers = JSON.parse(fileContent);
        } catch (parseError: any) {
          throw new Error(`Failed to parse answers file: ${parseError.message}`);
        }

        if (!Array.isArray(answers)) {
          throw new Error('Generated answers file does not contain an array of questions');
        }

        // Ensure each answer has the correct structure
        const processedAnswers = answers.map(answer => ({
          ...answer,
          id: answer.id || Math.random().toString(36).substring(7),
          text: answer.question_text || answer.text,
          question_text: answer.question_text || answer.text,
          status: answer.status || 'Draft',
          timestamp: answer.timestamp || Date.now(),
          // Ensure draftAnswer is always present
          draftAnswer: answer.draftAnswer
        }));

        return NextResponse.json({
          status: 'success',
          answers: processedAnswers,
          message: 'Draft answers generated successfully (using fallback file)',
          outputFile: mostRecentAnswersFile
        });
      } catch (fallbackError: any) {
        return NextResponse.json(
          { error: `Failed to read generated answers: ${error.message}. Fallback also failed: ${fallbackError.message}` },
          { status: 500 }
        );
      }
    }

  } catch (error: any) {
    console.error('Answer generation error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: `Answer generation failed: ${error?.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}