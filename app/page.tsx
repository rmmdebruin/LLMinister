'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import {
  MdAdd,
  MdDelete,
  MdOutlineArrowForward,
  MdOutlineLabel,
  MdOutlineQuestionAnswer,
  MdOutlineSettings,
  MdOutlineVideoLibrary
} from 'react-icons/md';
import { useStore } from './lib/store';

const DashboardCard = ({
  title,
  description,
  icon,
  linkText,
  linkHref,
  bgGradient = 'from-blue-500/10 to-purple-500/10',
  count,
  countLabel
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkHref: string;
  bgGradient?: string;
  count?: number;
  countLabel?: string;
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className={`bg-gradient-to-r ${bgGradient} p-6`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-slate-700 dark:text-slate-300 mb-2 text-3xl">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
          {count !== undefined && (
            <div className="bg-white dark:bg-slate-700 rounded-lg px-3 py-2 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {count}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {countLabel}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Link
          href={linkHref}
          className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
        >
          {linkText}
          <MdOutlineArrowForward />
        </Link>
      </div>
    </div>
  );
};

export default function Home() {
  const questions = useStore((state) => state.questions);
  const transcripts = useStore((state) => state.transcripts);
  const categories = useStore((state) => state.categories);
  const addCategory = useStore((state) => state.addCategory);
  const removeCategory = useStore((state) => state.removeCategory);
  const [newCategory, setNewCategory] = useState('');

  // Count questions by status
  const draftQuestions = questions.filter(q => q.status === 'Draft').length;
  const totalQuestions = questions.length;

  // Count questions by category
  const questionsByCategory = categories.map(category => ({
    name: category,
    count: questions.filter(q => q.category === category).length
  }));

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Welkom bij LLMinister, uw assistent voor het beantwoorden van parlementaire vragen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Parlementaire Vragen"
          description="Beheer en beantwoord vragen van Tweede Kamerleden."
          icon={<MdOutlineQuestionAnswer />}
          linkText="Bekijk alle vragen"
          linkHref="/vragen"
          bgGradient="from-blue-500/10 to-blue-600/10"
          count={totalQuestions}
          countLabel="Vragen"
        />

        <DashboardCard
          title="Transcripties"
          description="Upload en verwerk video's van debatten."
          icon={<MdOutlineVideoLibrary />}
          linkText="Nieuwe transcriptie"
          linkHref="/transcriptie"
          bgGradient="from-purple-500/10 to-purple-600/10"
          count={transcripts.length}
          countLabel="Transcripties"
        />

        <DashboardCard
          title="Instellingen"
          description="Configureer API-sleutels en gebruikersrollen."
          icon={<MdOutlineSettings />}
          linkText="Beheer instellingen"
          linkHref="/instellingen"
          bgGradient="from-slate-500/10 to-slate-600/10"
        />
      </div>

      {totalQuestions > 0 && (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Status Overzicht
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {draftQuestions}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Concept antwoorden
              </div>
            </div>
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {questions.filter(q => q.status === 'Herschreven').length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Herschreven antwoorden
              </div>
            </div>
            <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {questions.filter(q => q.status === 'Definitief').length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Definitieve antwoorden
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <MdOutlineLabel className="mr-2" />
              Categorieën
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Beheer de categorieën voor parlementaire vragen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Nieuwe categorie"
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
              title="Nieuwe categorie toevoegen"
            >
              <MdAdd />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {questionsByCategory.map(({ name, count }) => (
            <div
              key={name}
              className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600 flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/vragen?category=${name}`}
                  className="bg-white/50 dark:bg-slate-600/50 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {count} {count === 1 ? 'vraag' : 'vragen'}
                </Link>
                {name !== 'Algemeen' && (
                  <button
                    onClick={() => removeCategory(name)}
                    className="p-1.5 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Verwijder categorie"
                  >
                    <MdDelete className="text-lg" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}