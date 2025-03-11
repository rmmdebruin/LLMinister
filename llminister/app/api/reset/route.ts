import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST() {
  try {
    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');
    const transcriptsDir = path.join(dataDir, 'transcripts');
    const questionsDir = path.join(dataDir, 'questions');
    const answersDir = path.join(dataDir, 'answers');

    // Clear transcripts directory
    if (fs.existsSync(transcriptsDir)) {
      fs.readdirSync(transcriptsDir).forEach((file) => {
        const filePath = path.join(transcriptsDir, file);
        fs.unlinkSync(filePath);
      });
    }

    // Clear questions directory
    if (fs.existsSync(questionsDir)) {
      fs.readdirSync(questionsDir).forEach((file) => {
        const filePath = path.join(questionsDir, file);
        fs.unlinkSync(filePath);
      });
    }

    // Clear answers directory
    if (fs.existsSync(answersDir)) {
      fs.readdirSync(answersDir).forEach((file) => {
        if (file !== '.DS_Store') { // Skip .DS_Store files
          const filePath = path.join(answersDir, file);
          fs.unlinkSync(filePath);
        }
      });
    }

    return NextResponse.json({ status: 'success', message: 'Data reset successfully' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: `Reset failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}