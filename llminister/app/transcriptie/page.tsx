'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdInfoOutline, MdOutlineFileUpload, MdWarning } from 'react-icons/md';
import QuestionList from '../components/QuestionList';
import { useStore } from '../lib/store';
import { TranscriptionService } from '../lib/transcription-service';

export default function TranscriptiePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null);

  // Get store actions and settings
  const addTranscript = useStore((state) => state.addTranscript);
  const loadQuestionsFromFile = useStore((state) => state.loadQuestionsFromFile);
  const settings = useStore((state) => state.settings);
  const setAnthropicApiKey = useStore((state) => state.setAnthropicApiKey);

  // Initialize transcription service when settings change
  useEffect(() => {
    if (settings.assemblyAIKey && settings.anthropicKey) {
      setTranscriptionService(new TranscriptionService());
      setAnthropicApiKey(settings.anthropicKey);
    } else {
      setTranscriptionService(null);
    }
  }, [settings.assemblyAIKey, settings.anthropicKey, setAnthropicApiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Reset processing state when a new file is selected
      setProcessingStatus('idle');
      setProcessingMessage('');
      setProcessingProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !transcriptionService) {
      if (!transcriptionService) {
        setProcessingStatus('error');
        setProcessingMessage('API sleutels zijn niet geconfigureerd. Configureer eerst de API sleutels in de instellingen.');
      }
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('processing');
      setProcessingMessage('Starten met verwerken...');
      setProcessingProgress(0);

      // Process the video with progress updates
      const result = await transcriptionService.processVideo(
        file,
        (progress, message) => {
          setProcessingProgress(progress);
          setProcessingMessage(message);
        }
      );

      // Add transcript to store
      addTranscript({
        title: file.name,
        content: result.transcript
      });

      // Load questions into store
      loadQuestionsFromFile(result.questions);

      // Update UI state
      setProcessingStatus('success');
      setProcessingMessage('Video succesvol verwerkt! U kunt nu de geëxtraheerde vragen bekijken.');

      // Automatically navigate to questions page after a short delay
      setTimeout(() => {
        router.push('/vragen');
      }, 2000);
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessingStatus('error');
      setProcessingMessage(`Er is een fout opgetreden bij het verwerken van de video: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderProcessingStatus = () => {
    switch (processingStatus) {
      case 'processing':
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

      case 'success':
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
                  <button
                    onClick={() => {
                      setFile(null);
                      setProcessingStatus('idle');
                      setProcessingMessage('');
                      setProcessingProgress(0);
                    }}
                    className="px-4 py-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium"
                  >
                    Nieuwe Transcriptie
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'error':
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

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Video Transcriptie</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload Video</h2>

            {/* File upload section */}
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

            {/* API key check */}
            {!transcriptionService && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30 mb-4">
                <div className="flex">
                  <MdWarning className="text-yellow-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-700 dark:text-yellow-300">API sleutels ontbreken</h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      Configureer eerst de API sleutels in de{' '}
                      <Link href="/instellingen" className="underline font-medium">
                        instellingen
                      </Link>{' '}
                      voordat je een video kunt verwerken.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing button */}
            <button
              onClick={handleUpload}
              disabled={!file || isProcessing || !transcriptionService}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isProcessing ? 'Verwerken...' : 'Verwerk Video'}
            </button>

            {/* Processing status */}
            {renderProcessingStatus()}
          </div>
        </div>

        <div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Geëxtraheerde Vragen</h2>
            <QuestionList />
          </div>
        </div>
      </div>
    </div>
  );
}