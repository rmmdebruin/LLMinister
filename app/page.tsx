'use client';

import Link from 'next/link';
import React from 'react';
import { MdOutlineArrowForward, MdOutlineQuestionAnswer, MdOutlineSettings, MdOutlineVideoLibrary } from 'react-icons/md';
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

  // Count questions by status
  const draftQuestions = questions.filter(q => q.status === 'Draft').length;
  const totalQuestions = questions.length;

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
    </div>
  );
}