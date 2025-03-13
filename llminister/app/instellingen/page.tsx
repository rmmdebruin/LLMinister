'use client';

import { useState } from 'react';
import { MdCheckCircle, MdOutlineAdminPanelSettings, MdOutlineApi, MdWarning } from 'react-icons/md';
import { useStore } from '../lib/store';

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [assemblyAIKey, setAssemblyAIKey] = useState(settings?.assemblyAIKey || '');
  const [anthropicKey, setAnthropicKey] = useState(settings?.anthropicKey || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
      setMessage('Fout bij opslaan van instellingen');
    }
  };

  // Example admin users
  const adminUsers = [
    { id: 1, name: 'R de Bruin', email: 'rmmdebruin[at]gmail[dot]com', role: 'Admin' },
  ];

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
          {/* Anthropic Key */}
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Anthropic API Sleutel
            </label>
            <input
              type="text"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono tracking-wider"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Nodig voor het analyseren en genereren van antwoorden.
            </p>
          </div>

          {/* AssemblyAI Key */}
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              AssemblyAI API Sleutel
            </label>
            <input
              type="text"
              value={assemblyAIKey}
              onChange={(e) => setAssemblyAIKey(e.target.value)}
              placeholder="Vul uw AssemblyAI sleutel in"
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono tracking-wider"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Nodig om video's te transcriberen. Verkrijgbaar op assemblyai.com.
            </p>
          </div>
        </div>

        {saveStatus !== 'idle' && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              saveStatus === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
            }`}
          >
            <div className="flex items-start">
              {saveStatus === 'success' ? (
                <MdCheckCircle className="text-green-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
              ) : (
                <MdWarning className="text-red-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
              )}
              <p
                className={`text-sm ${
                  saveStatus === 'success'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
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
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.name}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.email}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
