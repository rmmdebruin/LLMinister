import fs from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Question, QuestionUpdate } from '../models/question';
import { QuestionExtractorService } from '../services/questionExtractor';

export class QuestionController {
  private questionExtractor: QuestionExtractorService;
  private dataDir: string;

  constructor(apiKey: string, dataDir: string) {
    this.questionExtractor = new QuestionExtractorService(apiKey);
    this.dataDir = dataDir;
  }

  async extractQuestions(
    transcriptPath: string,
    categories: string[] = ['Algemeen'],
    speakersListPath?: string
  ): Promise<{ questions: Question[], outputPath: string }> {
    try {
      // Read transcript
      const transcript = await readFile(transcriptPath, 'utf-8');

      // Read speakers list if provided
      let speakersList: string[] | undefined;
      if (speakersListPath) {
        const speakersContent = await readFile(speakersListPath, 'utf-8');
        speakersList = speakersContent.split('\n').filter(line => line.trim());
      }

      // Extract questions
      const questions = await this.questionExtractor.extractQuestionsFromTranscript(
        transcript,
        categories,
        speakersList
      );

      // Save questions
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const outputPath = path.join(this.dataDir, 'questions', `questions_${timestamp}.json`);

      await writeFile(outputPath, JSON.stringify(questions, null, 2), 'utf-8');

      return { questions, outputPath };
    } catch (error) {
      throw new Error(`Failed to extract questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateQuestion(questionId: string, update: QuestionUpdate): Promise<Question> {
    try {
      // Find the most recent questions file
      const questionsDir = path.join(this.dataDir, 'questions');
      const files = await readdir(questionsDir);
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(questionsDir, a));
          const statB = fs.statSync(path.join(questionsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      if (jsonFiles.length === 0) {
        throw new Error('No questions file found');
      }

      // Read and update the question
      const filePath = path.join(questionsDir, jsonFiles[0]);
      const questions: Question[] = JSON.parse(await readFile(filePath, 'utf-8'));

      const questionIndex = questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        throw new Error('Question not found');
      }

      const updatedQuestion = {
        ...questions[questionIndex],
        ...update,
        updatedAt: new Date()
      };

      questions[questionIndex] = updatedQuestion;

      // Save the updated questions
      await writeFile(filePath, JSON.stringify(questions, null, 2), 'utf-8');

      return updatedQuestion;
    } catch (error) {
      throw new Error(`Failed to update question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQuestions(): Promise<Question[]> {
    try {
      const questionsDir = path.join(this.dataDir, 'questions');
      const files = await readdir(questionsDir);
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(questionsDir, a));
          const statB = fs.statSync(path.join(questionsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      if (jsonFiles.length === 0) {
        return [];
      }

      const filePath = path.join(questionsDir, jsonFiles[0]);
      return JSON.parse(await readFile(filePath, 'utf-8'));
    } catch (error) {
      throw new Error(`Failed to get questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteQuestion(questionId: string): Promise<void> {
    try {
      const questionsDir = path.join(this.dataDir, 'questions');
      const files = await readdir(questionsDir);
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(questionsDir, a));
          const statB = fs.statSync(path.join(questionsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      if (jsonFiles.length === 0) {
        throw new Error('No questions file found');
      }

      const filePath = path.join(questionsDir, jsonFiles[0]);
      const questions: Question[] = JSON.parse(await readFile(filePath, 'utf-8'));

      const updatedQuestions = questions.filter(q => q.id !== questionId);

      if (updatedQuestions.length === questions.length) {
        throw new Error('Question not found');
      }

      await writeFile(filePath, JSON.stringify(updatedQuestions, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to delete question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}