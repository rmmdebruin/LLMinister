'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { MdEdit, MdOutlineFilterList, MdPlayArrow, MdRefresh, MdSave } from 'react-icons/md';
import { Question, useStore } from '../lib/store';

// Define props interface for the QuestionCard component
interface QuestionCardProps {
  question: Question;
  onUpdateQuestion: (updatedQuestion: Question) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onUpdateQuestion }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(question.draftAnswer || '');
  const [status, setStatus] = useState<'Draft' | 'Herschreven' | 'Definitief'>(question.status);
  const [nextAction, setNextAction] = useState(question.nextAction || '');
  const [responsible, setResponsible] = useState(question.personResponsible || '');

  const handleSave = () => {
    onUpdateQuestion({
      ...question,
      draftAnswer: editedAnswer,
      status: status,
      nextAction: nextAction,
      personResponsible: responsible
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                {question.category || 'Algemeen'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
                <MdPlayArrow className="mr-1" />
                {question.videoTimestamp || '00:00:00'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {question.text}
            </h3>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 flex items-center">
          <span className="font-medium">{question.speaker || 'Onbekend'}</span>
          <span className="mx-1">•</span>
          <span className="text-blue-600 dark:text-blue-400">{question.party || 'Onbekend'}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Concept Antwoord
          </h4>
          {isEditing ? (
            <textarea
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-slate-700 dark:text-slate-300">
              {question.draftAnswer}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Draft' | 'Herschreven' | 'Definitief')}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="Draft">Draft</option>
                  <option value="Herschreven">Herschreven</option>
                  <option value="Definitief">Definitief</option>
                </select>
              ) : (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm">
                  {question.status}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Volgende actie
              </label>
              {isEditing ? (
                <select
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="Herschrijven">Herschrijven</option>
                  <option value="Check senior">Check senior</option>
                  <option value="Klaar">Klaar</option>
                </select>
              ) : (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm">
                  {question.nextAction}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Persoon verantwoordelijk
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Naam van verantwoordelijke"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                />
              ) : (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm">
                  {question.personResponsible || 'Niet toegewezen'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium flex items-center"
              >
                <MdSave className="mr-1" />
                Opslaan
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center"
            >
              <MdEdit className="mr-1" />
              Bewerken
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const VragenPage = () => {
  // Get questions and categories from store
  const questions = useStore((state) => state.questions);
  const categories = useStore((state) => state.categories);
  const updateQuestion = useStore((state) => state.updateQuestion);
  const loadQuestionsFromFile = useStore((state) => state.loadQuestionsFromFile);

  const [filters, setFilters] = useState({
    topic: 'Alle',
    party: 'Alle',
    status: 'Alle',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get unique parties from questions
  const partyOptions = ['Alle', ...new Set(questions.map(q => q.party).filter(Boolean))];

  // Filter questions based on selected filters
  const filteredQuestions = questions.filter(q => {
    return (filters.topic === 'Alle' || q.category === filters.topic) &&
           (filters.party === 'Alle' || q.party === filters.party) &&
           (filters.status === 'Alle' || q.status === filters.status);
  });

  // Function to load the latest extracted questions
  const loadLatestQuestions = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: useStore.getState().settings.anthropicKey,
          categories: categories
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load questions');
      }

      const data = await response.json();

      if (data.status === 'success' && data.questions) {
        loadQuestionsFromFile(data.questions);
      } else {
        throw new Error('No questions found in the response');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoadError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Parlementaire Vragen
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Beheer en beantwoord vragen van Tweede Kamerleden gericht aan de minister.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadLatestQuestions}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium shadow-sm"
            >
              <MdRefresh className="mr-2" />
              {isLoading ? 'Laden...' : 'Laad Vragen'}
            </button>
            <Link
              href="/transcriptie"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-sm"
            >
              Nieuwe Transcriptie
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <strong>Fout bij laden van vragen:</strong> {loadError}
          </div>
        )}
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-3">
          <MdOutlineFilterList className="mr-2" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Categorie
            </label>
            <select
              value={filters.topic}
              onChange={(e) => setFilters({...filters, topic: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="Alle">Alle categorieën</option>
              {categories.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Partij
            </label>
            <select
              value={filters.party}
              onChange={(e) => setFilters({...filters, party: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              {partyOptions.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="Alle">Alle statussen</option>
              {['Draft', 'Herschreven', 'Definitief'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              onUpdateQuestion={updateQuestion}
            />
          ))
        ) : (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Geen vragen gevonden die aan de huidige filters voldoen.
            </p>
            <button
              onClick={loadLatestQuestions}
              disabled={isLoading}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium"
            >
              <MdRefresh className="mr-2" />
              {isLoading ? 'Laden...' : 'Laad Geëxtraheerde Vragen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VragenPage;