'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: string;
  text: string;
  question_text?: string;
  timestamp: string;
  speaker: string;
  party: string;
  category: string;
  status: 'Draft' | 'Herschreven' | 'Definitief' | string;
  draftAnswer?: string;
  nextAction?: string;
  personResponsible?: string;
  createdAt?: string;
  updatedAt?: string;
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        set((state) => ({
          questions: state.questions.map(q => q.id === questionId ? { ...q, ...data.question } : q)
        }));
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
