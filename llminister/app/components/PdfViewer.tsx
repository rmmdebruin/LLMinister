'use client';

import { useEffect, useState } from 'react';
import { MdExpandLess, MdExpandMore, MdFileDownload, MdOutlineArrowBack } from 'react-icons/md';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  filePath: string;
  pageNumber: number;
  sourceId: string;
  sourceTitle: string;
  onClose: () => void;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

export default function PdfViewer({
  filePath,
  pageNumber,
  sourceId,
  sourceTitle,
  onClose,
  onLoadSuccess,
  onLoadError
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber);
  const [scale, setScale] = useState<number>(1.2);

  // Convert file path to URL for backend API
  const fileUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/pdf?path=${encodeURIComponent(filePath)}`;

  // URL for viewing just the specific page
  const pageUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/pdf-page?source=${encodeURIComponent(sourceTitle)}&page=${currentPage}`;

  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber, filePath]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    if (onLoadSuccess) onLoadSuccess();
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error while loading PDF', error);
    setError('Er is een fout opgetreden bij het laden van de PDF. Probeer het later nogmaals.');
    setLoading(false);
    if (onLoadError) onLoadError();
  }

  function changePage(offset: number) {
    const newPage = currentPage + offset;
    if (numPages && newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.7));
  }

  // Handle downloading the current page
  const handleDownloadPage = () => {
    window.open(pageUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 border-b border-slate-200 dark:border-slate-600">
        <button
          onClick={onClose}
          className="flex items-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-1"
          aria-label="Close PDF viewer"
        >
          <MdOutlineArrowBack className="text-xl" />
        </button>
        <div className="flex-1 mx-2 truncate">
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {sourceTitle}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Bron: {sourceId} | Pagina: {currentPage} / {numPages || '?'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPage}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"
            aria-label="Download current page"
            title="Download deze pagina"
          >
            <MdFileDownload className="text-xl" />
          </button>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.7}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full disabled:opacity-50"
            aria-label="Zoom out"
            title="Zoom uit"
          >
            <span className="text-lg font-bold">-</span>
          </button>
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full disabled:opacity-50"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            disabled={currentPage <= 1}
            onClick={previousPage}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full disabled:opacity-50"
            aria-label="Previous page"
          >
            <MdExpandLess className="text-xl" />
          </button>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {currentPage} / {numPages || '?'}
          </span>
          <button
            disabled={numPages === null || currentPage >= numPages}
            onClick={nextPage}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full disabled:opacity-50"
            aria-label="Next page"
          >
            <MdExpandMore className="text-xl" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
              {error}
            </div>
          </div>
        )}

        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="text-center p-4">Laden...</div>}
          className="flex justify-center"
        >
          <Page
            pageNumber={currentPage}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-md"
            scale={scale}
          />
        </Document>
      </div>
    </div>
  );
}