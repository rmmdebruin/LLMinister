import { AnthropicService } from './anthropic-service';
import { Question, useStore } from './store';

/**
 * Service for handling video transcription and question extraction
 */
export class TranscriptionService {
  private assemblyAIService: AssemblyAIService | null = null;
  private anthropicService: AnthropicService;

  constructor() {
    const store = useStore.getState();
    this.anthropicService = new AnthropicService(store.settings.anthropicKey);

    // Only initialize AssemblyAI service if we have an API key
    if (store.settings.assemblyAIKey) {
      this.assemblyAIService = new AssemblyAIService(store.settings.assemblyAIKey);
    }
  }

  /**
   * Process a video file: transcribe and extract questions
   */
  async processVideo(
    file: File,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<{
    transcript: string;
    questions: Question[];
  }> {
    if (!this.assemblyAIService) {
      throw new Error('AssemblyAI API key is not configured. Please add your API key in the settings.');
    }

    try {
      // Start transcription
      if (progressCallback) progressCallback(10, 'Starting transcription...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', this.assemblyAIService.getApiKey());

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, just use the status text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.status !== 'success' || !data.transcript) {
        throw new Error(data.error || 'Transcription failed with unknown error');
      }

      if (progressCallback) progressCallback(100, 'Processing complete!');

      return {
        transcript: data.transcript,
        questions: data.questions || []
      };
    } catch (error) {
      console.error('Error in transcription process:', error);
      throw error;
    }
  }
}

/**
 * AssemblyAI API service for transcription
 */
class AssemblyAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getApiKey(): string {
    return this.apiKey;
  }
}

// Export a singleton instance
export const transcriptionService = new TranscriptionService();