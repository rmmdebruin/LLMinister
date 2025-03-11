interface Question {
  text: string;
  status: 'Draft' | 'Herschreven' | 'Definitief';
}

interface ExtractedQuestion {
  text: string;
}

/**
 * Service to interact with Anthropic's Claude AI via API routes
 */
export class AnthropicService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Extract questions from a transcript using Claude via API
   */
  async extractQuestions(transcript: string): Promise<Question[]> {
    try {
      const response = await fetch('/api/questions/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          transcript
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to extract questions');
      }

      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Error extracting questions:', error);
      throw error;
    }
  }

  /**
   * Generate a draft answer for a question via API
   */
  async generateAnswer(question: string): Promise<string> {
    try {
      const response = await fetch('/api/anthropic/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }

  /**
   * Build a prompt for generating an answer to a parliamentary question
   * @param question The parliamentary question
   * @param relevantDocs Reference documents to use when generating the answer
   * @returns A formatted prompt
   */
  private buildPrompt(question: string, relevantDocs: Array<{title: string, content: string, page: number}>): string {
    // Construct the prompt with the question and any relevant documents
    let prompt = `Vraag: ${question}\n\n`;

    if (relevantDocs.length > 0) {
      prompt += 'Relevante documenten:\n\n';

      for (const doc of relevantDocs) {
        prompt += `Document: ${doc.title}\n`;
        prompt += `Pagina: ${doc.page}\n`;
        prompt += `Inhoud: ${doc.content}\n\n`;
      }

      prompt += 'Schrijf op basis van bovenstaande documenten een antwoord op de vraag in de ik-vorm (vanuit de minister).';
    } else {
      prompt += 'Er zijn geen specifieke documenten beschikbaar. Schrijf een algemeen antwoord op de vraag in de ik-vorm (vanuit de minister) op basis van algemene kennis.';
    }

    return prompt;
  }
}