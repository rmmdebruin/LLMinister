'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MdHelp,
  MdOutlineFilterList,
  MdOutlineLabel,
  MdOutlineQuestionAnswer,
  MdOutlineRadioButtonChecked,
  MdOutlineVideoLibrary,
  MdPerson,
  MdRefresh
} from 'react-icons/md';
import QuestionCard from '../components/QuestionCard';
import { useStore } from '../lib/store';

export default function VragenPage() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    party: '',
    status: ''
  });
  // New state for source viewer visibility
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false);

  // From Zustand store
  const questions = useStore((state) => state.questions);
  const loadQuestionsFromFile = useStore((state) => state.loadQuestionsFromFile);
  const updateQuestion = useStore((state) => state.updateQuestion);
  const deleteQuestion = useStore((state) => state.deleteQuestion);

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    const catMatch = !selectedFilters.category || q.category === selectedFilters.category;
    const partyMatch = !selectedFilters.party || q.party === selectedFilters.party;
    const statusMatch = !selectedFilters.status || q.status === selectedFilters.status;
    return catMatch && partyMatch && statusMatch;
  });

  useEffect(() => {
    // auto-load questions on page mount
    handleLoadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to load questions from backend
  const handleLoadQuestions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/questions`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.questions) {
        loadQuestionsFromFile(data.questions);
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate answers
  const handleGenerateAnswers = async () => {
    try {
      setIsGeneratingAnswers(true);
      const ids = questions.map(q => q.id);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/generate-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_ids: ids })
      });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (data.questions) {
        loadQuestionsFromFile(data.questions);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Fout bij genereren conceptantwoorden: ${err.message}`);
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Function to extract questions from the latest transcript
  const handleExtractLatestQuestions = async () => {
    try {
      setIsExtracting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/extract-latest-questions`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (data.questions) {
        loadQuestionsFromFile(data.questions);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (err: any) {
      console.error('Error extracting questions:', err);
      alert(`Fout bij extractie: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filter: 'category' | 'party' | 'status', value: string) => {
    setSelectedFilters(prev => ({ ...prev, [filter]: value }));
  };

  // New function to handle source viewer visibility update
  const handleSourceViewerOpenChange = (isOpen: boolean) => {
    setIsSourceViewerOpen(isOpen);
  };

  return (
    <div className="space-y-6">
      {/* Success message popup */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 max-w-sm w-full animate-fade-in">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Conceptantwoorden/vragen geüpdatet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                De vragen of antwoorden zijn succesvol verwerkt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
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
              disabled={questions.length === 0 || isGeneratingAnswers}
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineQuestionAnswer className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  {isGeneratingAnswers ? 'Antwoorden genereren...' : 'Genereer Concept Antwoorden'}
                </span>
              </div>
            </button>
            <button
              onClick={handleLoadQuestions}
              disabled={isLoading}
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdRefresh className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">{isLoading ? 'Laden...' : 'Laad Vragen'}</span>
              </div>
            </button>
            <button
              onClick={handleExtractLatestQuestions}
              disabled={isExtracting}
              className="min-w-[150px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50
                         backdrop-blur-sm text-slate-700 dark:text-slate-300
                         text-base font-medium rounded-lg shadow-sm border border-slate-200
                         dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70
                         transition-all disabled:opacity-50"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdHelp className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  {isExtracting ? 'Vragen extraheren...' : 'Extract Vragen'}
                </span>
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

      {/* Filter panel */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative z-40">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
          <MdOutlineFilterList className="mr-2 text-xl" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {/* Filter for Category */}
          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineLabel className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  Categorie: {selectedFilters.category || 'Alle'}
                </span>
              </div>
            </button>
            <div className="absolute left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <div
                onClick={() => handleFilterChange('category', '')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Alle
              </div>
              {[...new Set(questions.map(q => q.category))].map(cat => (
                <div
                  key={cat}
                  onClick={() => handleFilterChange('category', cat)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Filter for Status */}
          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdOutlineRadioButtonChecked className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  Status: {selectedFilters.status || 'Alle'}
                </span>
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

          {/* Filter for Party */}
          <div className="relative group">
            <button
              type="button"
              className="min-w-[200px] w-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdPerson className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  Partij: {selectedFilters.party || 'Alle'}
                </span>
              </div>
            </button>
            <div className="absolute left-0 right-0 mt-2 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <div
                onClick={() => handleFilterChange('party', '')}
                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                Alle
              </div>
              {[...new Set(questions.map(q => q.party).filter(p => p))].map(party => (
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

      {/* Questions list */}
      <div className="space-y-6 relative z-30">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(q => (
            <div key={q.id} className={`transition-all duration-300 ${isSourceViewerOpen ? 'source-viewer-open' : ''}`}>
              <QuestionCard
                key={q.id}
                question={q}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestion}
                onSourceViewerToggle={handleSourceViewerOpenChange}
              />
            </div>
          ))
        ) : (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Geen vragen gevonden die aan de huidige filters voldoen.
            </p>
            <button
              onClick={handleLoadQuestions}
              disabled={isLoading}
              className="min-w-[200px] min-h-[48px] inline-flex bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-base font-medium rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all disabled:opacity-50 mt-4"
            >
              <div className="flex items-start px-5 py-2.5 w-full">
                <MdRefresh className="mr-2 text-xl flex-shrink-0 mt-0.5" />
                <span className="leading-tight text-left">
                  {isLoading ? 'Laden...' : 'Laad Geëxtraheerde Vragen'}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}