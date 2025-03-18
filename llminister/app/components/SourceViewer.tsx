'use client';

import { useEffect, useState } from 'react';
import { MdDescription, MdInfoOutline, MdOpenInNew } from 'react-icons/md';
import PdfViewer from './PdfViewer';

interface Citation {
  source_id: string;
  title: string;
  page: number;
}

interface Sentence {
  text: string;
  citations: Citation[];
}

interface Source {
  id: string;
  title: string;
  page: number;
  file_path: string;
  similarity_score: number;
}

interface SourceViewerProps {
  sources: Source[];
  sentences: Sentence[];
  onPdfViewerOpen?: (isOpen: boolean) => void;
}

export default function SourceViewer({ sources = [], sentences = [], onPdfViewerOpen }: SourceViewerProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error'>('idle');

  // Check if we have valid sources data
  const hasValidSources = Array.isArray(sources) && sources.length > 0 && sources[0]?.id;
  const hasValidSentences = Array.isArray(sentences) && sentences.length > 0;

  // Group sources by source ID for efficient lookup
  const sourceMap = hasValidSources
    ? sources.reduce((acc, source) => {
        if (source && source.id) {
          acc[source.id] = source;
        }
        return acc;
      }, {} as Record<string, Source>)
    : {};

  // Effect to notify parent component when PDF viewer state changes
  useEffect(() => {
    if (onPdfViewerOpen) {
      onPdfViewerOpen(isPdfOpen);
    }
  }, [isPdfOpen, onPdfViewerOpen]);

  // Handle sentence click to show the corresponding source
  const handleSentenceClick = (citations: Citation[]) => {
    if (citations && citations.length > 0) {
      const citation = citations[0]; // Use the first citation
      setSelectedSourceId(citation.source_id);
      setSelectedPage(citation.page);
      setIsPdfOpen(true);
      setLoadingState('loading');
    }
  };

  // Close the PDF viewer
  const handleClosePdf = () => {
    setIsPdfOpen(false);
    setSelectedSourceId(null);
    setSelectedPage(null);
  };

  // Handle PDF load success
  const handlePdfLoadSuccess = () => {
    setLoadingState('idle');
  };

  // Handle PDF load error
  const handlePdfLoadError = () => {
    setLoadingState('error');
  };

  // Selected source information
  const selectedSource = selectedSourceId && sourceMap[selectedSourceId]
    ? sourceMap[selectedSourceId]
    : null;

  // If no valid data, show a message
  if (!hasValidSources || !hasValidSentences) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center p-4">
            <MdInfoOutline className="mx-auto text-4xl text-slate-400 dark:text-slate-500 mb-3" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Geen brongegevens beschikbaar
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Er zijn geen bronverwijzingen beschikbaar voor dit antwoord.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {isPdfOpen && selectedSource && selectedPage ? (
        <PdfViewer
          filePath={selectedSource.file_path}
          pageNumber={selectedPage}
          sourceId={selectedSource.id}
          sourceTitle={selectedSource.title}
          onClose={handleClosePdf}
          onLoadSuccess={handlePdfLoadSuccess}
          onLoadError={handlePdfLoadError}
        />
      ) : (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Bronnen & Referenties</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Klik op een zin om de bijbehorende bronpagina te bekijken
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Antwoord met bronverwijzingen</h4>
                {sentences.map((sentence, index) => (
                  <div
                    key={index}
                    onClick={() => sentence.citations && sentence.citations.length > 0 && handleSentenceClick(sentence.citations)}
                    className={`p-3 rounded-lg text-sm ${
                      sentence.citations && sentence.citations.length > 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <span>{sentence.text}</span>
                    {sentence.citations && sentence.citations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sentence.citations.map((citation, cIndex) => (
                          <span
                            key={cIndex}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          >
                            <MdDescription className="mr-1" />
                            {citation.title} (p.{citation.page})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alle gebruikte bronnen</h4>
                <div className="space-y-2">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      onClick={() => {
                        setSelectedSourceId(source.id);
                        setSelectedPage(source.page);
                        setIsPdfOpen(true);
                        setLoadingState('loading');
                      }}
                      className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <MdDescription className="text-slate-500 dark:text-slate-400 mr-3 text-xl" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{source.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Pagina {source.page}</div>
                      </div>
                      {typeof source.similarity_score === 'number' && (
                        <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-2 py-1">
                          {Math.round(source.similarity_score * 100)}% relevant
                        </div>
                      )}
                      <button
                        className="ml-2 p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                        title="Open PDF"
                      >
                        <MdOpenInNew />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingState === 'loading' && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      )}
    </div>
  );
}