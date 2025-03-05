'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the Question interface
export interface Question {
  id: string;
  question_text?: string;  // From extracted questions
  text: string;            // Used in the UI
  status: 'Draft' | 'Herschreven' | 'Definitief';
  answer?: string;
  draftAnswer?: string;
  timestamp: number;       // Creation timestamp
  videoTimestamp?: string;  // Timestamp in the video [HH:MM:SS]
  speaker?: string;         // Speaker name or identifier
  party?: string;           // Political party of the speaker
  category?: string;        // Topic/category of the question
  nextAction?: string;      // Next action to take
  personResponsible?: string; // Person responsible for the question
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

// Define the store state
interface StoreState {
  questions: Question[];
  transcripts: Transcript[];
  settings: Settings;
  categories: string[];
  addQuestion: (question: Omit<Question, 'id' | 'timestamp'>) => void;
  addTranscript: (transcript: Omit<Transcript, 'id' | 'timestamp'>) => void;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (id: string) => void;
  deleteTranscript: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  loadQuestionsFromFile: (questions: any[]) => void;
}

// Create the store
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      questions: [],
      transcripts: [],
      categories: ['Economie', 'Klimaat', 'Landbouw', 'Infrastructuur', 'Onderwijs'],
      settings: {
        assemblyAIKey: defaultAssemblyAIKey,
        anthropicKey: defaultAnthropicKey
      },
      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              ...question,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
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
      updateQuestion: (updatedQuestion) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === updatedQuestion.id ? { ...q, ...updatedQuestion } : q
          ),
        })),
      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
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
        set((state) => {
          // Convert extracted questions to the format used in the store
          const newQuestions = extractedQuestions.map(q => ({
            id: Math.random().toString(36).substring(7),
            text: q.question_text,
            question_text: q.question_text,
            status: 'Draft' as const,
            timestamp: Date.now(),
            videoTimestamp: q.timestamp,
            speaker: q.speaker,
            party: q.party,
            category: q.category,
            draftAnswer: '',
            nextAction: 'Beantwoorden',
            personResponsible: 'Minister'
          }));

          return {
            questions: [...state.questions, ...newQuestions]
          };
        }),
    }),
    {
      name: 'llminister-storage',
    }
  )
);