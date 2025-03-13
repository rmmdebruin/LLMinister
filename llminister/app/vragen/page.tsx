'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MdDelete,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  // 1) Add this import for the new button icon
  MdHelp,
  MdOutlineAssignmentTurnedIn,
  MdOutlineFilterList,
  MdOutlineLabel,
  MdOutlineQuestionAnswer,
  MdOutlineRadioButtonChecked,
  MdOutlineVideoLibrary,
  MdPerson,
  MdRefresh,
  MdSave
} from 'react-icons/md';
import { Question, useStore } from '../lib/store';

export default function VragenPage() {
  // 2) Existing state
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // 3) New state for extracting questions
  const [isExtracting, setIsExtracting] = useState(false);

  // 4) Filters
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    party: '',
    status: ''
  });

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

  // Existing function to load questions from backend
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

  // Existing function to generate answers
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

  // 5) New function to extract questions from the latest transcript
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
            <QuestionCard
              key={q.id}
              question={q}
              onUpdateQuestion={updateQuestion}
              onDeleteQuestion={deleteQuestion}
            />
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

// Reuse your QuestionCard from the original code
function QuestionCard({
  question,
  onUpdateQuestion,
  onDeleteQuestion
}: {
  question: Question;
  onUpdateQuestion: (id: string, update: Partial<Question>) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(question.draftAnswer);
  const [editedQuestionText, setEditedQuestionText] = useState(question.text);
  const [status, setStatus] = useState(question.status);
  const [nextAction, setNextAction] = useState(question.nextAction);
  const [responsible, setResponsible] = useState(question.personResponsible);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setEditedAnswer(question.draftAnswer);
    setEditedQuestionText(question.text);
    setStatus(question.status);
    setNextAction(question.nextAction);
    setResponsible(question.personResponsible);
  }, [question]);

  const hasLongAnswer = editedAnswer && editedAnswer.split('\n').length > 4;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateQuestion(question.id, {
        question_text: editedQuestionText,
        draftAnswer: editedAnswer,
        status,
        nextAction,
        personResponsible: responsible
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) {
      try {
        await onDeleteQuestion(question.id);
      } catch (err) {
        console.error(err);
        alert('Fout bij verwijderen vraag.');
      }
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
              <span className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-full shadow-sm flex items-center">
                {question.timestamp || question.createdAt}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
              {/* STATUS */}
              <div className="flex items-center">
                <div className="relative group">
                  <button
                    type="button"
                    className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 min-w-[140px] flex items-center"
                  >
                    <MdOutlineRadioButtonChecked className="mr-2 text-base" />
                    <span className="flex-grow text-left">Status: {status}</span>
                  </button>
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div
                      onClick={() => setStatus('Draft')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Draft
                    </div>
                    <div
                      onClick={() => setStatus('Herschreven')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Herschreven
                    </div>
                    <div
                      onClick={() => setStatus('Definitief')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Definitief
                    </div>
                  </div>
                </div>
              </div>
              {/* NEXT ACTION */}
              <div className="flex items-center">
                <div className="relative group">
                  <button
                    type="button"
                    className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 min-w-[160px] flex items-center"
                  >
                    <MdOutlineAssignmentTurnedIn className="mr-2 text-base" />
                    <span className="flex-grow text-left">Actie: {nextAction || 'Geen'}</span>
                  </button>
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div
                      onClick={() => setNextAction('')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Geen
                    </div>
                    <div
                      onClick={() => setNextAction('Herschrijven')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Herschrijven
                    </div>
                    <div
                      onClick={() => setNextAction('Check senior')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Check senior
                    </div>
                    <div
                      onClick={() => setNextAction('Klaar')}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                    >
                      Klaar
                    </div>
                  </div>
                </div>
              </div>
              {/* RESPONSIBLE */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-600 min-w-[160px] flex items-center">
                    <MdPerson className="mr-2 text-base" />
                    <input
                      type="text"
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      placeholder="Verantwoordelijke"
                      className="bg-transparent border-none text-slate-700 dark:text-slate-300 text-sm p-0 w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              {isEditing ? (
                <textarea
                  value={editedQuestionText}
                  onChange={(e) => setEditedQuestionText(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {question.text}
                </h3>
              )}
              <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center">
                <span className="font-medium">{question.speaker || 'Onbekend'}</span>
                <span className="mx-1">•</span>
                <span className="text-blue-600 dark:text-blue-400">{question.party || 'Onbekend'}</span>
              </div>
            </div>
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
                className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm border border-slate-200 dark:border-slate-600"
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
                className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap ${
                  hasLongAnswer ? 'overflow-hidden transition-all duration-500 ease-in-out' : ''
                }`}
                style={hasLongAnswer ? { maxHeight: isExpanded ? '2000px' : '150px' } : {}}
              >
                {question.draftAnswer || ''}
              </div>
              {hasLongAnswer && !isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent pointer-events-none rounded-b-lg" />
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
                className="bg-white/50 dark:bg-slate-700/50 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium shadow-sm border border-slate-200 dark:border-slate-600"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-4 py-2 text-white rounded-full text-sm font-medium flex items-center shadow-sm transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24" />
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
            <>
              <button
                onClick={handleDelete}
                className="bg-white/50 dark:bg-slate-700/50 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center shadow-sm border border-slate-200 dark:border-slate-600"
              >
                <MdDelete className="mr-1" />
                Verwijderen
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/50 dark:bg-slate-700/50 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center shadow-sm border border-slate-200 dark:border-slate-600"
              >
                <MdEdit className="mr-1" />
                Bewerken
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
