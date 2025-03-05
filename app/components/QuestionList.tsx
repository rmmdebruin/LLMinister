'use client';

import { useState } from 'react';
import { FaBuilding } from 'react-icons/fa';
import { MdAccessTime, MdCategory, MdPerson } from 'react-icons/md';
import { Question, useStore } from '../lib/store';

export default function QuestionList() {
  const questions = useStore((state) => state.questions);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from questions
  const categories = ['all', ...new Set(questions.map(q => q.category || 'general'))];

  // Filter questions by category
  const filteredQuestions = selectedCategory && selectedCategory !== 'all'
    ? questions.filter(q => q.category === selectedCategory)
    : questions;

  // Sort questions by timestamp (newest first)
  const sortedQuestions = [...filteredQuestions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category:</span>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === 'all' ? null : category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                (category === 'all' && !selectedCategory) || category === selectedCategory
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {sortedQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No questions found. Upload a video to extract questions.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col space-y-3">
        <div className="text-lg font-medium text-gray-900 dark:text-white">
          {question.text}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          {question.videoTimestamp && (
            <div className="flex items-center">
              <MdAccessTime className="mr-1" />
              <span>{question.videoTimestamp}</span>
            </div>
          )}

          {question.speaker && (
            <div className="flex items-center">
              <MdPerson className="mr-1" />
              <span>{question.speaker}</span>
            </div>
          )}

          {question.party && (
            <div className="flex items-center">
              <FaBuilding className="mr-1" />
              <span>{question.party}</span>
            </div>
          )}

          {question.category && (
            <div className="flex items-center">
              <MdCategory className="mr-1" />
              <span>{question.category}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className={`px-2 py-1 text-xs rounded-full ${
            question.status === 'Draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            question.status === 'Herschreven' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {question.status}
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(question.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}