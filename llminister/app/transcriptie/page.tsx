'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { MdCheckCircle, MdInfoOutline, MdOutlineFileUpload, MdWarning } from 'react-icons/md';
import { useStore } from '../lib/store';

export default function TranscriptiePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const loadQuestionsFromFile = useStore((state) => state.loadQuestionsFromFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setProcessingStatus('idle');
      setProcessingMessage('');
      setProcessingProgress(0);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProcessingStatus('processing');
      setProcessingMessage('Verwerken... (video upload & transcriptie)');

      // 1. Upload to Python
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setProcessingMessage('Transcriptie gereed. Extractie vragen...');
      // 2. Extract questions
      const extractRes = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/extract-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_path: data.transcriptPath,
          categories: ['Algemeen'] // or let user set categories
        }),
      });
      if (!extractRes.ok) throw new Error(await extractRes.text());
      const extractData = await extractRes.json();

      // load them into store
      if (extractData.questions) {
        loadQuestionsFromFile(extractData.questions);
      }

      setProcessingStatus('success');
      setProcessingMessage('Vragen geëxtraheerd! U wordt doorgestuurd naar /vragen...');
      setTimeout(() => {
        router.push('/vragen');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setProcessingStatus('error');
      setProcessingMessage(`Fout: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatus = () => {
    if (processingStatus === 'processing') {
      return (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30 flex items-start">
            <MdInfoOutline className="text-blue-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300">{processingMessage}</h3>
              <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {processingProgress}% voltooid
              </p>
            </div>
          </div>
        </div>
      );
    } else if (processingStatus === 'success') {
      return (
        <div className="mt-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30 flex items-start">
            <MdCheckCircle className="text-green-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-700 dark:text-green-300">{processingMessage}</h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                U wordt automatisch doorgestuurd naar de vragenpagina...
              </p>
              <div className="mt-3 flex space-x-3">
                <Link
                  href="/vragen"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  Bekijk Vragen
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (processingStatus === 'error') {
      return (
        <div className="mt-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 flex items-start">
            <MdWarning className="text-red-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-700 dark:text-red-300">Verwerkingsfout</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{processingMessage}</p>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setProcessingStatus('idle');
                    setProcessingMessage('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Opnieuw Proberen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Video Transcriptie</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecteer een videobestand
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <MdOutlineFileUpload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Klik om te uploaden</span> of sleep een bestand hierheen
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">MP4, MOV, AVI, etc.</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                </label>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Geselecteerd bestand: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              onClick={handleTranscribe}
              disabled={!file || isProcessing}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isProcessing ? 'Verwerken...' : 'Verwerk Video en Extraheer Vragen'}
            </button>

            {renderStatus()}
          </div>
        </div>

        <div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Geëxtraheerde Vragen</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              De nieuwe vragen verschijnen automatisch op de Vragen-pagina zodra de transcriptie en extractie is voltooid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
