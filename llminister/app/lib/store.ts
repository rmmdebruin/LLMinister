'use client';

import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the Question interface
export interface Question {
  id: string;
  text: string;
  question_text?: string;  // For backward compatibility
  timestamp: string;
  videoTimestamp?: string;  // Timestamp in the video [HH:MM:SS]
  speaker: string;
  party: string;
  category: string;
  status: 'Draft' | 'Herschreven' | 'Definitief';
  draftAnswer?: string;
  nextAction?: string;
  personResponsible?: string;
}

// Define the Transcript interface
export interface Transcript {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

// Define the Settings interface
export interface Settings {
  assemblyAIKey: string;
  anthropicKey: string;
}

// Get environment variables for API keys
const defaultAssemblyAIKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '';
const defaultAnthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';

// Define the store state interface
interface StoreState {
  questions: Question[];
  transcripts: Transcript[];
  settings: Settings;
  categories: string[];
  anthropicApiKey: string;
  addQuestion: (question: Omit<Question, 'id' | 'timestamp'>) => void;
  addTranscript: (transcript: Omit<Transcript, 'id' | 'timestamp'>) => void;
  updateQuestion: (questionId: string, update: Partial<Question>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  deleteTranscript: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  loadQuestionsFromFile: (extractedQuestions: Array<{
    id?: string;
    question_text?: string;
    text?: string;
    timestamp?: string;
    speaker?: string;
    party?: string;
    category?: string;
    status?: 'Draft' | 'Herschreven' | 'Definitief';
    draftAnswer?: string;
  }>) => void;
  resetData: () => Promise<void>;
  setAnthropicApiKey: (key: string) => void;
}

// Create the store
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      questions: [],
      transcripts: [],
      categories: ['Algemeen'],
      settings: {
        assemblyAIKey: defaultAssemblyAIKey,
        anthropicKey: defaultAnthropicKey
      },
      anthropicApiKey: '',
      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              ...question,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now().toString(),
            },
          ],
        })),
      addTranscript: (transcript) =>
        set((state) => ({
          transcripts: [
            ...state.transcripts,
            {
              ...transcript,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
            },
          ],
        })),
      updateQuestion: async (questionId, update) => {
        const state = get();
        try {
          const response = await fetch('/api/questions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionId,
              update,
              apiKey: state.anthropicApiKey
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update question');
          }

          const { question } = await response.json();

          set((state: StoreState) => ({
            questions: state.questions.map((q: Question) =>
              q.id === questionId ? { ...q, ...question } : q
            )
          }));
        } catch (error) {
          console.error('Error updating question:', error);
          throw error;
        }
      },
      deleteQuestion: async (questionId) => {
        const state = get();
        try {
          const response = await fetch(`/api/questions?id=${questionId}&apiKey=${state.anthropicApiKey}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete question');
          }

          set((state: StoreState) => ({
            questions: state.questions.filter((q: Question) => q.id !== questionId)
          }));
        } catch (error) {
          console.error('Error deleting question:', error);
          throw error;
        }
      },
      deleteTranscript: (id) =>
        set((state) => ({
          transcripts: state.transcripts.filter((t) => t.id !== id),
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),
      removeCategory: (category) =>
        set((state) => ({
          categories: state.categories.filter((c) => c !== category),
        })),
      loadQuestionsFromFile: (extractedQuestions) =>
        set((state: StoreState) => {
          console.log(`Loading ${extractedQuestions.length} questions into store`);

          // Convert extracted questions to the format used in the store
          const newQuestions: Question[] = extractedQuestions.map(q => ({
            id: q.id || uuidv4(),
            text: q.question_text || q.text || '',
            timestamp: q.timestamp || '',
            speaker: q.speaker || '',
            party: q.party || '',
            category: q.category || 'Algemeen',
            status: q.status || 'Draft',
            draftAnswer: q.draftAnswer || ''
          }));

          return {
            ...state,
            questions: [...state.questions, ...newQuestions]
          };
        }),
      resetData: async () => {
        try {
          // Reset the store state
          set(() => ({
            questions: [],
            transcripts: [],
            categories: ['Algemeen']
          }));

          // Call the reset API endpoint
          const response = await fetch('/api/reset', {
            method: 'POST'
          });

          if (!response.ok) {
            throw new Error('Failed to reset data on server');
          }
        } catch (error) {
          console.error('Error resetting data:', error);
          throw error;
        }
      },
      setAnthropicApiKey: (key) => set((state: StoreState) => ({ ...state, anthropicApiKey: key }))
    }),
    {
      name: 'question-store',
      partialize: (state) => ({
        questions: state.questions,
        anthropicApiKey: state.anthropicApiKey
      })
    }
  )
);

export const updateQuestion = async (questionId: string, update: Partial<Question>, state: any) => {
  try {
    const response = await fetch('/api/questions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        update,
        apiKey: state.anthropicKey
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update question');
    }

    const { question } = await response.json();

    set((state) => ({
      questions: state.questions.map(q =>
        q.id === questionId ? { ...q, ...question } : q
      )
    }));
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (questionId: string, state: any) => {
  try {
    const response = await fetch(`/api/questions?id=${questionId}&apiKey=${state.anthropicKey}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete question');
    }

    set((state) => ({
      questions: state.questions.filter(q => q.id !== questionId)
    }));
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};