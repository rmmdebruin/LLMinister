'use client';

import { useState } from 'react';
import { FaBuilding } from 'react-icons/fa';
import { MdAccessTime, MdCategory, MdPerson } from 'react-icons/md';
import { useStore } from '../lib/store';

export default function QuestionList() {
  const questions = useStore((state) => state.questions);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['all', ...new Set(questions.map(q => q.category || 'Algemeen'))];

  const filtered = selectedCategory && selectedCategory !== 'all'
    ? questions.filter(q => q.category === selectedCategory)
    : questions;

  const sorted = [...filtered].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category:</span>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'all' ? null : cat)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                (cat === 'all' && !selectedCategory) || cat === selectedCategory
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Nog geen vragen gevonden. Upload een video om vragen te extraheren.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(q => (
            <div
              key={q.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col space-y-3">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {q.text}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  {q.timestamp && (
                    <div className="flex items-center">
                      <MdAccessTime className="mr-1" />
                      <span>{q.timestamp}</span>
                    </div>
                  )}
                  {q.speaker && (
                    <div className="flex items-center">
                      <MdPerson className="mr-1" />
                      <span>{q.speaker}</span>
                    </div>
                  )}
                  {q.party && (
                    <div className="flex items-center">
                      <FaBuilding className="mr-1" />
                      <span>{q.party}</span>
                    </div>
                  )}
                  {q.category && (
                    <div className="flex items-center">
                      <MdCategory className="mr-1" />
                      <span>{q.category}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    q.status === 'Draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : q.status === 'Herschreven'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {q.status}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {q.updatedAt ? new Date(q.updatedAt).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
