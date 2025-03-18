'use client';

import { useEffect, useState } from 'react';
import {
  MdDelete,
  MdDocumentScanner,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdOutlineAssignmentTurnedIn,
  MdOutlineRadioButtonChecked,
  MdPerson,
  MdSave
} from 'react-icons/md';
import { Question } from '../lib/store';
import SourceViewer from './SourceViewer';

interface QuestionCardProps {
  question: Question;
  onUpdateQuestion: (id: string, update: Partial<Question>) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onSourceViewerToggle?: (isOpen: boolean) => void; // New prop added
}

export default function QuestionCard({
  question,
  onUpdateQuestion,
  onDeleteQuestion,
  onSourceViewerToggle
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Handle both string and object draftAnswer
  const getAnswerText = (draftAnswer: any): string => {
    if (!draftAnswer) return '';
    if (typeof draftAnswer === 'string') return draftAnswer;
    if (typeof draftAnswer === 'object' && draftAnswer.answer_text) return draftAnswer.answer_text;
    return '';
  };

  const [editedAnswer, setEditedAnswer] = useState(getAnswerText(question.draftAnswer));
  const [editedQuestionText, setEditedQuestionText] = useState(question.text);
  const [status, setStatus] = useState(question.status);
  const [nextAction, setNextAction] = useState(question.nextAction);
  const [responsible, setResponsible] = useState(question.personResponsible);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSourceViewer, setShowSourceViewer] = useState(false);

  // Functions to get sources and sentences from question data
  const getSources = (q: Question) => {
    if (!q.draftAnswer) return [];

    if (typeof q.draftAnswer === 'object') {
      if (q.draftAnswer.sources) return q.draftAnswer.sources;
    }

    return q.sources || [];
  };

  const getSentences = (q: Question) => {
    if (!q.draftAnswer) return [];

    if (typeof q.draftAnswer === 'object') {
      if (q.draftAnswer.sentences) return q.draftAnswer.sentences;
    }

    return q.sentences || [];
  };

  // Get sources and sentences
  const sources = getSources(question);
  const sentences = getSentences(question);

  useEffect(() => {
    setEditedAnswer(getAnswerText(question.draftAnswer));
    setEditedQuestionText(question.text);
    setStatus(question.status);
    setNextAction(question.nextAction);
    setResponsible(question.personResponsible);
  }, [question]);

  const answerText = getAnswerText(question.draftAnswer);
  const hasLongAnswer = answerText && answerText.split('\n').length > 4;
  const hasSourceData = sources.length > 0 && sentences.length > 0;

  // New function to handle source viewer toggle
  const handleSourceViewerToggle = (isVisible: boolean) => {
    setShowSourceViewer(isVisible);
    if (onSourceViewerToggle) {
      onSourceViewerToggle(isVisible);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // If the original draftAnswer was an object with sources and sentences,
      // maintain that structure but update the answer_text
      let updatedDraftAnswer;

      if (typeof question.draftAnswer === 'object' && question.draftAnswer !== null) {
        updatedDraftAnswer = {
          ...question.draftAnswer,
          answer_text: editedAnswer
        };
      } else {
        updatedDraftAnswer = editedAnswer;
      }

      await onUpdateQuestion(question.id, {
        text: editedQuestionText,
        question_text: editedQuestionText,
        draftAnswer: updatedDraftAnswer,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div className={`lg:col-span-${showSourceViewer && hasSourceData ? '2' : '3'} bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md`}>
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
                        value={responsible || ''}
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
              <div className="flex items-center space-x-2">
                {hasSourceData && (
                  <button
                    onClick={() => handleSourceViewerToggle(!showSourceViewer)}
                    className="bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm border border-slate-200 dark:border-slate-600"
                  >
                    <MdDocumentScanner className="mr-1" />
                    {showSourceViewer ? 'Verberg bronnen' : 'Toon bronnen'}
                  </button>
                )}

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
                  {answerText}
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

      {/* Source Viewer Panel (shown conditionally) */}
      {showSourceViewer && hasSourceData && (
        <div className="lg:col-span-1 h-full">
          <SourceViewer
            sources={sources}
            sentences={sentences}
            onPdfViewerOpen={(isOpen) => {
              // Notify parent when PDF viewer is open/closed
              if (onSourceViewerToggle) {
                onSourceViewerToggle(isOpen);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}