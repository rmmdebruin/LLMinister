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
  resetData: () => Promise<void>;
}

// Create the store
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      questions: [],
      transcripts: [],
      categories: ['Algemeen'],
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
          console.log(`Loading ${extractedQuestions.length} questions into store`);

          // Convert extracted questions to the format used in the store
          const newQuestions = extractedQuestions.map(q => {
            // Check if this question already exists in the store
            const existingQuestion = state.questions.find(
              existingQ =>
                (existingQ.question_text && existingQ.question_text === q.question_text) ||
                existingQ.text === q.text
            );

            // Log the draft answer for debugging
            if (q.draftAnswer) {
              console.log(`Question has draft answer: ${q.question_text?.substring(0, 30)}...`);
            }

            return {
              id: existingQuestion?.id || q.id || Math.random().toString(36).substring(7),
              text: q.question_text || q.text,
              question_text: q.question_text || q.text,
              status: existingQuestion?.status || q.status || 'Draft' as const,
              timestamp: existingQuestion?.timestamp || q.timestamp || Date.now(),
              videoTimestamp: q.timestamp || q.videoTimestamp || existingQuestion?.videoTimestamp,
              speaker: q.speaker || existingQuestion?.speaker,
              party: q.party || existingQuestion?.party,
              category: q.category || existingQuestion?.category,
              // Use the new draft answer if it exists (including empty string), otherwise keep existing
              draftAnswer: 'draftAnswer' in q ? q.draftAnswer : existingQuestion?.draftAnswer,
              nextAction: q.nextAction || existingQuestion?.nextAction || 'Herschrijven',
              personResponsible: q.personResponsible || existingQuestion?.personResponsible || 'Verantwoordelijke'
            };
          });

          // Filter out questions that already exist in the store
          const uniqueNewQuestions = newQuestions.filter(newQ =>
            !state.questions.some(existingQ =>
              (existingQ.question_text && existingQ.question_text === newQ.question_text) ||
              existingQ.text === newQ.text
            )
          );

          // Update existing questions with new data
          const updatedExistingQuestions = state.questions.map(existingQ => {
            const matchingNewQ = newQuestions.find(newQ =>
              (existingQ.question_text && existingQ.question_text === newQ.question_text) ||
              existingQ.text === newQ.text
            );

            if (matchingNewQ) {
              // Log when updating an existing question with a draft answer
              if (matchingNewQ.draftAnswer && matchingNewQ.draftAnswer !== existingQ.draftAnswer) {
                console.log(`Updating existing question with draft answer: ${existingQ.text?.substring(0, 30)}...`);
              }

              return {
                ...existingQ,
                ...matchingNewQ,
                // Use the new draft answer if it exists (including empty string), otherwise keep existing
                draftAnswer: 'draftAnswer' in matchingNewQ ? matchingNewQ.draftAnswer : existingQ.draftAnswer
              };
            }

            return existingQ;
          });

          console.log(`Store updated: ${updatedExistingQuestions.length} existing questions updated, ${uniqueNewQuestions.length} new questions added`);

          return {
            questions: [...updatedExistingQuestions, ...uniqueNewQuestions]
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
    }),
    {
      name: 'llminister-storage',
    }
  )
);