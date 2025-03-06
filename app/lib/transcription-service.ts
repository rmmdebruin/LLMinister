import { AnthropicService } from './anthropic-service';
import { useStore } from './store';

// Mock transcript data for testing without actual API calls
const MOCK_TRANSCRIPT = `
[00:05:13] Voorzitter: Ik open de vergadering van de vaste commissie Economische Zaken en geef het woord aan mevrouw Van Dijk.

[00:05:23] Inge van Dijk (CDA): Dank u wel, voorzitter. Ik zou graag willen vragen aan de minister wat de rol van het Adviescollege Toetsing Regeldruk zal zijn bij het verminderen van administratieve lasten voor het MKB in de komende jaren? En hoe ziet het werkprogramma voor 2025 eruit?

[00:05:45] Voorzitter: Dank u wel. Het woord is aan de heer Sneller.

[00:05:52] Joost Sneller (D66): Voorzitter, dank. Ik sluit me aan bij de vraag van mevrouw Van Dijk, maar wil ook weten welke concrete maatregelen het ministerie neemt om de onafhankelijkheid van het Adviescollege Toetsing Regeldruk te waarborgen?

[00:06:14] Voorzitter: Dank u wel. Dan geef ik nu het woord aan de heer Grinwis.

[00:06:20] Pieter Grinwis (CU): Dank, voorzitter. Ik wil de minister vragen hoe de taak van het Adviescollege zich verhoudt tot Europese regelgeving en kan de minister toelichten welke invloed het college heeft op de implementatie van EU-richtlijnen?

[00:06:42] Voorzitter: Dank u wel. Dan is nu het woord aan de minister.

[00:06:48] Minister: Dank u wel, voorzitter. Ik dank de leden voor hun vragen over het Adviescollege Toetsing Regeldruk. Laat ik beginnen met...
`;

/**
 * AssemblyAI API service for transcription
 */
class AssemblyAIService {
  private apiKey: string;
  private baseUrl = 'https://api.assemblyai.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Upload a file to AssemblyAI
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.upload_url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Submit a transcription job
   */
  async submitTranscriptionJob(audioUrl: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript`, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'nl',
          speaker_labels: true,
          auto_chapters: true
        })
      });

      if (!response.ok) {
        throw new Error(`Transcription request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error submitting transcription job:', error);
      throw error;
    }
  }

  /**
   * Check the status of a transcription job
   */
  async checkTranscriptionStatus(jobId: string): Promise<{status: string, transcript?: string, error?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript/${jobId}`, {
        headers: {
          'authorization': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'completed') {
        // Format the transcript with timestamps and speakers
        let formattedTranscript = '';
        if (data.utterances) {
          data.utterances.forEach((utterance: any) => {
            const timestamp = this.formatTimestamp(utterance.start);
            const speaker = utterance.speaker || 'Onbekend';
            formattedTranscript += `[${timestamp}] ${speaker}: ${utterance.text}\n\n`;
          });
        } else {
          formattedTranscript = data.text;
        }

        return {
          status: data.status,
          transcript: formattedTranscript
        };
      }

      return {
        status: data.status,
        error: data.error
      };
    } catch (error) {
      console.error('Error checking transcription status:', error);
      throw error;
    }
  }

  /**
   * Format milliseconds to timestamp string (HH:MM:SS)
   */
  private formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

  /**
   * Transcribe a video using the Python backend
   */
  async transcribeWithPython(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', this.apiKey);

    try {
      console.log('Starting Python transcription process...');
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

      console.log('Python transcription completed successfully');
      return data.transcript;
    } catch (error) {
      console.error('Error in Python transcription process:', error);
      throw error;
    }
  }
}

/**
 * Service for handling video transcription and question extraction
 */
export class TranscriptionService {
  private assemblyAIService: AssemblyAIService | null = null;
  private anthropicService: AnthropicService;
  private usePythonBackend: boolean = true; // Set to true to use Python backend

  constructor() {
    const store = useStore.getState();
    this.anthropicService = new AnthropicService(store.settings.anthropicKey);

    // Only initialize AssemblyAI service if we have an API key
    if (store.settings.assemblyAIKey) {
      this.assemblyAIService = new AssemblyAIService(store.settings.assemblyAIKey);
    }
  }

  /**
   * Transcribe a video file to text
   */
  async transcribeVideo(file: File,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<string> {
    if (!this.assemblyAIService) {
      throw new Error('AssemblyAI API key is not configured. Please add your API key in the settings.');
    }

    try {
      if (this.usePythonBackend) {
        // Use Python backend for transcription
        if (progressCallback) progressCallback(10, 'Starting transcription with Python backend...');

        // Call the Python backend
        if (progressCallback) progressCallback(30, 'Transcriberen...');
        const transcript = await this.assemblyAIService.transcribeWithPython(file);

        if (progressCallback) progressCallback(100, 'Transcription complete!');
        return transcript;
      } else {
        // Use JavaScript implementation
        // Upload file
        if (progressCallback) progressCallback(10, 'Uploading file...');
        const uploadUrl = await this.assemblyAIService.uploadFile(file);

        if (progressCallback) progressCallback(30, 'Starting transcription...');
        const jobId = await this.assemblyAIService.submitTranscriptionJob(uploadUrl);

        if (progressCallback) progressCallback(40, 'Processing audio...');

        // Poll for results
        let result = await this.assemblyAIService.checkTranscriptionStatus(jobId);
        let attempts = 0;
        const maxAttempts = 60; // Maximum 5 minutes (60 * 5 seconds)

        while (result.status !== 'completed' && result.status !== 'error' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
          result = await this.assemblyAIService.checkTranscriptionStatus(jobId);
          attempts++;

          // Update progress (from 40% to 90%)
          if (progressCallback) {
            const progress = 40 + Math.min(50, Math.floor((attempts / maxAttempts) * 50));
            progressCallback(progress, 'Processing audio...');
          }
        }

        if (result.status === 'error' || !result.transcript) {
          throw new Error(result.error || 'Transcription failed with unknown error');
        }

        if (progressCallback) progressCallback(100, 'Transcription complete!');
        return result.transcript;
      }
    } catch (error) {
      console.error('Error in transcription process:', error);
      throw error;
    }
  }

  /**
   * Extract questions from transcript using Claude AI
   */
  async extractQuestions(transcript: string): Promise<Array<{
    text: string;
    timestamp: string;
    speaker: string;
    party: string;
    category: string;
    status: 'Draft' | 'Herschreven' | 'Definitief';
  }>> {
    try {
      // Get categories from store if available
      const categories = ['Algemeen']; // Default category

      // Use the new Python-based question extraction API
      const response = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.anthropicService.getApiKey(),
          categories: categories,
        }),
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

      if (data.status !== 'success' || !data.questions) {
        throw new Error(data.error || 'Question extraction failed with unknown error');
      }

      // Map the questions to the expected format
      return data.questions.map((question: {
        question_text: string;
        timestamp: string;
        speaker: string;
        party: string;
        category: string;
      }) => ({
        text: question.question_text,
        timestamp: question.timestamp,
        speaker: question.speaker,
        party: question.party,
        category: question.category,
        status: 'Draft' as const
      }));
    } catch (error) {
      console.error('Error extracting questions:', error);
      throw error;
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
    questions: Array<{
      text: string;
      timestamp: string;
      speaker: string;
      party: string;
      category: string;
      status: 'Draft' | 'Herschreven' | 'Definitief';
    }>;
  }> {
    // First transcribe the video
    const transcript = await this.transcribeVideo(file, progressCallback);

    if (progressCallback) progressCallback(90, 'Extractie van vragen...');

    // Then extract questions
    const questions = await this.extractQuestions(transcript);

    if (progressCallback) progressCallback(100, 'Processing complete!');

    return {
      transcript,
      questions
    };
  }
}

// Export a singleton instance
export const transcriptionService = new TranscriptionService();