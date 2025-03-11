import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionInput } from '../models/question';

export class QuestionExtractorService {
  private client: Anthropic;
  private model = 'claude-3-7-sonnet-20250219';

  constructor(apiKey: string) {
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid Anthropic API key');
    }
    this.client = new Anthropic({ apiKey });
  }

  async extractQuestionsFromTranscript(
    transcript: string,
    categories: string[] = ['Algemeen'],
    speakersList?: string[]
  ): Promise<Question[]> {
    const prompt = this.buildPrompt(transcript, categories, speakersList);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const questions = this.parseResponse(content);

      return questions.map(q => this.formatQuestion(q));
    } catch (error) {
      throw new Error(`Failed to extract questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(transcript: string, categories: string[], speakersList?: string[]): string {
    const categoriesStr = categories.join(', ');
    const speakersSection = speakersList ? `\nList of speakers ordered by their set time to speak:\n${speakersList.join('\n')}` : '';

    return `
    Extract all questions directed to the minister from the following parliamentary debate transcript.

    For each question, provide:
    1. The exact text of the question
    2. The timestamp in the format [HH:MM:SS] when the question was asked
    3. The name of the parliament member who asked the question (if available, otherwise use their identifier)
    4. The political party of the parliament member (if available, otherwise leave blank)
    5. The topic/category of the question (choose from: ${categoriesStr})

    Return the result as a JSON array of objects with the following fields:
    - "question_text": The exact text of the question
    - "timestamp": The timestamp when the question was asked
    - "speaker": The name or identifier of the speaker
    - "party": The political party of the speaker
    - "category": The topic/category of the question

    Rules:
    - Only include actual questions directed to the minister
    - Include implicit questions (e.g., "I would like to hear what the minister has to say about this")
    - Follow the parliamentary debate structure and speaking time rules
    - Be critical of speaker labels and verify them against the content${speakersSection}

    Transcript:
    ${transcript}`;
  }

  private parseResponse(content: string): QuestionInput[] {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                     content.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Anthropic response');
    }

    try {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatQuestion(input: QuestionInput): Question {
    const now = new Date();
    return {
      id: uuidv4(),
      ...input,
      status: 'Draft',
      createdAt: now,
      updatedAt: now
    };
  }
}