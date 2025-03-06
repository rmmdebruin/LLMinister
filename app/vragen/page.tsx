'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { MdEdit, MdExpandLess, MdExpandMore, MdOutlineAssignmentTurnedIn, MdOutlineFilterList, MdOutlineLabel, MdOutlineQuestionAnswer, MdOutlineRadioButtonChecked, MdOutlineVideoLibrary, MdPerson, MdPlayArrow, MdRefresh, MdSave } from 'react-icons/md';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when question prop changes
  useEffect(() => {
    setEditedAnswer(question.draftAnswer || '');
    setStatus(question.status);
    setNextAction(question.nextAction || '');
    setResponsible(question.personResponsible || '');
  }, [question]);

  // Calculate if the answer should have an expand button
  const hasLongAnswer = useMemo(() => {
    return question.draftAnswer && question.draftAnswer.split('\n').length > 4;
  }, [question.draftAnswer]);

  // Save changes to the question
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // First update the local store
      onUpdateQuestion({
        ...question,
        draftAnswer: editedAnswer,
        status: status,
        nextAction: nextAction,
        personResponsible: responsible
      });

      // Then save to the backend
      const response = await fetch('/api/save-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.question_text || question.text,
          draftAnswer: editedAnswer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save answer to backend');
      }

      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving answer:', error);
      setSaveError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  // Update a single metadata field
  const handleMetadataChange = async (field: 'status' | 'nextAction' | 'personResponsible', value: string) => {
    try {
      let updatedValue;

      // Update the local state
      if (field === 'status') {
        setStatus(value as 'Draft' | 'Herschreven' | 'Definitief');
        updatedValue = value;
      } else if (field === 'nextAction') {
        setNextAction(value);
        updatedValue = value;
      } else if (field === 'personResponsible') {
        setResponsible(value);
        updatedValue = value;
      }

      // Update the store
      onUpdateQuestion({
        ...question,
        [field]: updatedValue
      });

      // No need to save to backend here as it will be saved when the answer is saved
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-sm">
                {question.category || 'Algemeen'}
              </span>
              <span className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-full shadow-sm flex items-center">
                <MdPlayArrow className="mr-1" />
                {question.videoTimestamp || '00:00:00'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
              <div className="flex items-center">
                <div className="relative group">
                  <button
                    type="button"
                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all min-w-[140px] flex items-center"
                  >
                    <MdOutlineRadioButtonChecked className="mr-2 text-base" />
                    <span className="flex-grow text-left">Status: {status}</span>
                  </button>
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div
                      onClick={() => handleMetadataChange('status', 'Draft')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Draft
                    </div>
                    <div
                      onClick={() => handleMetadataChange('status', 'Herschreven')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Herschreven
                    </div>
                    <div
                      onClick={() => handleMetadataChange('status', 'Definitief')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Definitief
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative group">
                  <button
                    type="button"
                    className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all min-w-[160px] flex items-center"
                  >
                    <MdOutlineAssignmentTurnedIn className="mr-2 text-base" />
                    <span className="flex-grow text-left">Actie: {nextAction || 'Geen'}</span>
                  </button>
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div
                      onClick={() => handleMetadataChange('nextAction', '')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Geen
                    </div>
                    <div
                      onClick={() => handleMetadataChange('nextAction', 'Herschrijven')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Herschrijven
                    </div>
                    <div
                      onClick={() => handleMetadataChange('nextAction', 'Check senior')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Check senior
                    </div>
                    <div
                      onClick={() => handleMetadataChange('nextAction', 'Klaar')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Klaar
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all min-w-[160px] flex items-center">
                    <MdPerson className="mr-2 text-base" />
                    <input
                      type="text"
                      value={responsible}
                      onChange={(e) => handleMetadataChange('personResponsible', e.target.value)}
                      placeholder="Verantwoordelijke"
                      className="bg-transparent border-none text-slate-700 dark:text-slate-300 text-sm p-0 w-full focus:outline-none focus:ring-0 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {question.text}
          </h3>

          <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center">
            <span className="font-medium">{question.speaker || 'Onbekend'}</span>
            <span className="mx-1">•</span>
            <span className="text-blue-600 dark:text-blue-400">{question.party || 'Onbekend'}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concept Antwoord
            </h4>
            {!isEditing && hasLongAnswer && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all border border-slate-200 dark:border-slate-600"
                aria-expanded={isExpanded}
                aria-controls={`answer-content-${question.id}`}
              >
                {isExpanded ? (
                  <>
                    <MdExpandLess className="mr-1" />
                    Inklappen
                  </>
                ) : (
                  <>
                    <MdExpandMore className="mr-1" />
                    Uitklappen
                  </>
                )}
              </button>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div className="relative">
              <div
                id={`answer-content-${question.id}`}
                className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap ${hasLongAnswer ? 'overflow-hidden transition-all duration-500 ease-in-out' : ''}`}
                style={hasLongAnswer ? { maxHeight: isExpanded ? '2000px' : '150px' } : {}}
              >
                {question.draftAnswer}
              </div>
              {hasLongAnswer && !isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent pointer-events-none rounded-b-lg"></div>
              )}
            </div>
          )}

          {saveError && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <strong>Fout bij opslaan:</strong> {saveError}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium shadow-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all border border-slate-200 dark:border-slate-600 disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-4 py-2 text-white rounded-full text-sm font-medium flex items-center shadow-sm hover:from-blue-500/90 hover:to-purple-500/90 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opslaan...
                  </>
                ) : (
                  <>
                    <MdSave className="mr-1" />
                    Opslaan
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center shadow-sm hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all border border-slate-200 dark:border-slate-600"
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
  const addCategory = useStore((state) => state.addCategory);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Consolidate filter state
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    party: '',
    status: ''
  });

  // Get unique parties from questions
  const partyOptions = ['Alle', ...new Set(questions.map(q => q.party).filter(Boolean))];

  // Filter questions based on selected filters
  const filteredQuestions = questions.filter(q => {
    const categoryMatch = !selectedFilters.category || q.category === selectedFilters.category;
    const partyMatch = !selectedFilters.party || q.party === selectedFilters.party;
    const statusMatch = !selectedFilters.status || q.status === selectedFilters.status;
    return categoryMatch && partyMatch && statusMatch;
  });

  // Update filter handlers
  const handleFilterChange = (filterType: 'category' | 'party' | 'status', value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

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

  const handleGenerateAnswers = async () => {
    try {
      setIsGeneratingAnswers(true);
      const response = await fetch('/api/generate-answers', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate answers');
      }

      const data = await response.json();
      if (data.status === 'success' && data.answers) {
        // Load the questions with draft answers into the store
        console.log(`Received ${data.answers.length} questions with draft answers`);
        loadQuestionsFromFile(data.answers);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000); // Hide after 3 seconds
      } else {
        throw new Error('No answers received from the server');
      }
    } catch (error) {
      console.error('Error generating answers:', error);
      alert(`Er is een fout opgetreden bij het genereren van conceptantwoorden: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  return (
    <div className="space-y-6">
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 max-w-sm w-full animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Conceptantwoorden gegenereerd
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                De antwoorden zijn succesvol toegevoegd aan de vragen.
              </p>
            </div>
          </div>
        </div>
      )}
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
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleGenerateAnswers}
              disabled={isGeneratingAnswers || questions.length === 0}
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50 disabled:hover:bg-white/50 dark:disabled:hover:bg-slate-700/50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineQuestionAnswer className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">{isGeneratingAnswers ? 'Antwoorden genereren...' : 'Genereer Concept Antwoorden'}</span>
              </div>
            </button>
            <button
              onClick={loadLatestQuestions}
              disabled={isLoading}
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50 disabled:hover:bg-white/50 dark:disabled:hover:bg-slate-700/50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdRefresh className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">{isLoading ? 'Laden...' : 'Laad Vragen'}</span>
              </div>
            </button>
            <Link
              href="/transcriptie"
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineVideoLibrary className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">Nieuwe Transcriptie</span>
              </div>
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            <strong>Fout bij laden van vragen:</strong> {loadError}
          </div>
        )}
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative z-40">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
          <MdOutlineFilterList className="mr-2 text-xl" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineLabel className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">Categorie: {selectedFilters.category || 'Alle'}</span>
              </div>
            </button>
            <div className="absolute left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <div
                onClick={() => handleFilterChange('category', '')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Alle
              </div>
              {categories.map(category => (
                <div
                  key={category}
                  onClick={() => handleFilterChange('category', category)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineRadioButtonChecked className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">Status: {selectedFilters.status || 'Alle'}</span>
              </div>
            </button>
            <div className="absolute left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <div
                onClick={() => handleFilterChange('status', '')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Alle
              </div>
              <div
                onClick={() => handleFilterChange('status', 'Draft')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Draft
              </div>
              <div
                onClick={() => handleFilterChange('status', 'Herschreven')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Herschreven
              </div>
              <div
                onClick={() => handleFilterChange('status', 'Definitief')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Definitief
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdPerson className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">Partij: {selectedFilters.party || 'Alle'}</span>
              </div>
            </button>
            <div className="absolute left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <div
                onClick={() => handleFilterChange('party', '')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Alle
              </div>
              {Array.from(new Set(questions.map(q => q.party || '').filter(party => party !== ''))).map(party => (
                <div
                  key={party}
                  onClick={() => handleFilterChange('party', party)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  {party}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-30">
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
              className="min-w-[200px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50 disabled:hover:bg-white/50 dark:disabled:hover:bg-slate-700/50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdRefresh className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">{isLoading ? 'Laden...' : 'Laad Geëxtraheerde Vragen'}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VragenPage;