// app/lib/store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// app/lib/store.ts - Update the appropriate types

export interface Citation {
  source_id: string;
  title: string;
  page: number;
}

export interface Sentence {
  text: string;
  citations: Citation[];
}

export interface Source {
  id: string;
  title: string;
  page: number;
  file_path: string;
  similarity_score: number;
}

export interface AnswerData {
  answer_text: string;
  sources: Source[];
  sentences: Sentence[];
}

export interface Question {
  id: string;
  text: string;
  question_text?: string;
  timestamp: string;
  speaker: string;
  party: string;
  category: string;
  status: 'Draft' | 'Herschreven' | 'Definitief' | string;
  draftAnswer?: string | AnswerData;  // Can be either string or object
  nextAction?: string;
  personResponsible?: string;
  createdAt?: string;
  updatedAt?: string;
  // These fields may be populated separately from draftAnswer
  sources?: Source[];
  sentences?: Sentence[];
}

export interface Settings {
  assemblyAIKey: string;
  anthropicKey: string;
}

interface StoreState {
  questions: Question[];
  categories: string[];
  settings: Settings;
  loadQuestionsFromFile: (qs: Question[]) => void;
  updateQuestion: (questionId: string, update: Partial<Question>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetData: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      questions: [],
      categories: ['Algemeen'],
      settings: {
        assemblyAIKey: '',
        anthropicKey: ''
      },

      loadQuestionsFromFile: (qs) => {
        set(() => ({ questions: qs }));
      },

      async updateQuestion(questionId, update) {
        // Ensure we're sending the right structure to the backend
        // If draftAnswer is an object, ensure it's properly structured
        const formattedUpdate = { ...update };

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/questions/${questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formattedUpdate),
          });

          if (!res.ok) {
            throw new Error(await res.text());
          }

          const data = await res.json();

          set((state) => ({
            questions: state.questions.map(q => q.id === questionId ? { ...q, ...data.question } : q)
          }));
        } catch (error) {
          console.error('Error updating question:', error);
          throw error;
        }
      },

      async deleteQuestion(questionId) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/questions/${questionId}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        set((state) => ({
          questions: state.questions.filter(q => q.id !== questionId)
        }));
      },

      addCategory: (cat) => {
        set((state) => {
          if (!state.categories.includes(cat)) {
            return { categories: [...state.categories, cat] };
          }
          return {};
        });
      },

      removeCategory: (cat) => {
        set((state) => ({
          categories: state.categories.filter(c => c !== cat)
        }));
      },

      updateSettings: (s) => {
        set((state) => ({
          settings: { ...state.settings, ...s }
        }));
      },

      async resetData() {
        // call /reset
        const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/reset`, {
          method: 'POST'
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        // if successful, clear local store
        set(() => ({
          questions: [],
          categories: ['Algemeen']
        }));
      }
    }),
    {
      name: 'question-store',
      partialize: (state) => ({
        questions: state.questions,
        categories: state.categories,
        settings: state.settings
      })
    }
  )
);