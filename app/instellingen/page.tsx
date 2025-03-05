'use client';

import React, { useEffect, useState } from 'react';
import {
  MdAdd,
  MdCheckCircle,
  MdDelete,
  MdOutlineAdminPanelSettings,
  MdOutlineApi,
  MdOutlineCategory,
  MdWarning
} from 'react-icons/md';
import { AnthropicService } from '../lib/anthropic-service';
import { useStore } from '../lib/store';

export default function SettingsPage() {
  const { settings, categories, updateSettings, addCategory, removeCategory } = useStore(state => ({
    settings: state.settings,
    categories: state.categories,
    updateSettings: state.updateSettings,
    addCategory: state.addCategory,
    removeCategory: state.removeCategory
  }));

  const [assemblyAIKey, setAssemblyAIKey] = useState(settings.assemblyAIKey);
  const [newCategory, setNewCategory] = useState('');
  const [adminUsers, setAdminUsers] = useState([
    { id: 1, name: 'Jan-Willem de Vries', email: 'jwdevries@minezk.nl', role: 'Admin' },
    { id: 2, name: 'Marieke Jansen', email: 'mjansen@minezk.nl', role: 'Editor' },
    { id: 3, name: 'Thomas Bergmans', email: 'tbergmans@minezk.nl', role: 'Viewer' },
  ]);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [assemblyAITestResult, setAssemblyAITestResult] = useState<string | null>(null);
  const [anthropicKey, setAnthropicKey] = useState(settings.anthropicKey || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [anthropicService, setAnthropicService] = useState<AnthropicService | null>(null);

  // Initialize Anthropic service when the key changes
  useEffect(() => {
    if (anthropicKey) {
      setAnthropicService(new AnthropicService(anthropicKey));
    }
  }, [anthropicKey]);

  // Update store settings when API keys change
  useEffect(() => {
    updateSettings({ assemblyAIKey, anthropicKey });
  }, [assemblyAIKey, anthropicKey, updateSettings]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (category: string) => {
    removeCategory(category);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  const handleAnthropicApiTest = async () => {
    if (!anthropicService) {
      setApiTestResult('API-sleutel is niet geconfigureerd.');
      return;
    }

    setApiTestResult('Testen...');
    try {
      const result = await fetch('/api/anthropic/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Wat is het doel van het Ministerie van Economische Zaken?',
          apiKey: anthropicKey
        }),
      });

      if (!result.ok) {
        throw new Error(`API test failed with status: ${result.status}`);
      }

      const data = await result.json();
      setApiTestResult(data.answer && data.answer.length > 50
        ? 'Test geslaagd! API-sleutel werkt correct.'
        : 'Test mislukt. Controleer uw API-sleutel.');
    } catch (error) {
      setApiTestResult(`Test mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const handleAssemblyAITest = async () => {
    setAssemblyAITestResult('Testen...');
    try {
      // Simple API check to verify the key - just using the headers endpoint
      const response = await fetch('https://api.assemblyai.com/v2', {
        method: 'GET',
        headers: {
          'authorization': assemblyAIKey
        }
      });

      const success = response.ok;
      setAssemblyAITestResult(success ? 'Test geslaagd! API-sleutel werkt correct.' : 'Test mislukt. Controleer uw API-sleutel.');
    } catch (error) {
      setAssemblyAITestResult(`Test mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const handleSave = () => {
    try {
      updateSettings({
        assemblyAIKey,
        anthropicKey
      });
      setSaveStatus('success');
      setMessage('Instellingen succesvol opgeslagen');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setMessage('Er is een fout opgetreden bij het opslaan van de instellingen');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Instellingen
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Configureer API-sleutels, gebruikersrollen en andere applicatie-instellingen.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
          <MdOutlineApi className="mr-2 text-xl" />
          <h2 className="text-lg font-medium">API Configuratie</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Anthropic API Sleutel
            </label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleAnthropicApiTest}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                Test
              </button>
            </div>
            {apiTestResult && (
              <p className={`text-sm mt-2 ${apiTestResult.includes('geslaagd') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {apiTestResult}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Benodigd voor het genereren van antwoorden en het analyseren van vragen.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              AssemblyAI API Sleutel
            </label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={assemblyAIKey}
                onChange={(e) => setAssemblyAIKey(e.target.value)}
                placeholder="Vul uw AssemblyAI API sleutel in"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleAssemblyAITest}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                Test
              </button>
            </div>
            {assemblyAITestResult && (
              <p className={`text-sm mt-2 ${assemblyAITestResult.includes('geslaagd') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {assemblyAITestResult}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Benodigd voor het transcriberen van debatvideo's. Verkrijg een gratis sleutel op <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">assemblyai.com</a>.
            </p>
          </div>
        </div>

        {saveStatus !== 'idle' && (
          <div className={`mt-4 p-3 rounded-lg ${
            saveStatus === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
          }`}>
            <div className="flex items-start">
              {saveStatus === 'success' ? (
                <MdCheckCircle className="text-green-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
              ) : (
                <MdWarning className="text-red-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                saveStatus === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {message}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-sm"
          >
            Instellingen Opslaan
          </button>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
          <MdOutlineCategory className="mr-2 text-xl" />
          <h2 className="text-lg font-medium">Vraag Categorieën</h2>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nieuwe categorie"
              className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={handleAddCategory}
              className="p-2 bg-green-500 text-white rounded-lg"
            >
              <MdAdd />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
              <span className="text-slate-700 dark:text-slate-300 text-sm">{category}</span>
              <button
                onClick={() => handleDeleteCategory(category)}
                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <MdDelete />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center text-slate-700 dark:text-slate-300 mb-4">
          <MdOutlineAdminPanelSettings className="mr-2 text-xl" />
          <h2 className="text-lg font-medium">Gebruikersbeheer</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Naam</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Rol</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Acties</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.name}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.email}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.role}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}