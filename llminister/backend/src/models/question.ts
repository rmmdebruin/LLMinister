export interface Question {
  id: string;
  question_text: string;
  timestamp: string;
  speaker: string;
  party: string;
  category: string;
  status: 'Draft' | 'InProgress' | 'Completed';
  draftAnswer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionInput {
  question_text: string;
  timestamp: string;
  speaker: string;
  party: string;
  category: string;
}

export interface QuestionUpdate {
  question_text?: string;
  draftAnswer?: string;
  status?: 'Draft' | 'InProgress' | 'Completed';
}