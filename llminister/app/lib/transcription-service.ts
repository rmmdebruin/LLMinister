/**
 * Service for handling video transcription and question extraction
 */
export class TranscriptionService {
  private assemblyAIKey: string;
  private anthropicKey: string;
  private backendUrl: string;

  constructor() {
    this.assemblyAIKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '';
    this.anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

    if (!this.assemblyAIKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    if (!this.anthropicKey) {
      throw new Error('Anthropic API key not configured');
    }
  }

  async transcribeVideo(file: File, onProgress: (progress: string) => void): Promise<{ transcript: string; questions: any[] }> {
    try {
      onProgress('Uploading video...');

      const formData = new FormData();
      formData.append('file', file);

      // Send video to FastAPI backend for transcription
      const transcribeResponse = await fetch(`${this.backendUrl}/api/transcribe`, {
        method: 'POST',
        headers: {
          'X-AssemblyAI-Key': this.assemblyAIKey,
        },
        body: formData,
        mode: 'cors',
        credentials: 'include',
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.text();
        throw new Error(`Transcription failed: ${error}`);
      }

      const transcribeResult = await transcribeResponse.json();

      if (transcribeResult.status === 'error') {
        throw new Error(transcribeResult.error);
      }

      onProgress('Extracting questions...');

      // Extract questions using the transcript
      const extractResponse = await fetch(`${this.backendUrl}/api/questions/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anthropic-Key': this.anthropicKey,
        },
        body: JSON.stringify({
          transcript_path: transcribeResult.transcript_path,
        }),
        mode: 'cors',
        credentials: 'include',
      });

      if (!extractResponse.ok) {
        const error = await extractResponse.text();
        throw new Error(`Question extraction failed: ${error}`);
      }

      const extractResult = await extractResponse.json();

      if (extractResult.status === 'error') {
        throw new Error(extractResult.error);
      }

      onProgress('Done!');

      return {
        transcript: transcribeResult.transcript,
        questions: extractResult.questions,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}