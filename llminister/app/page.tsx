import Link from 'next/link';
import {
  MdOutlineArrowForward, MdOutlineQuestionAnswer,
  MdOutlineSettings,
  MdOutlineVideoLibrary
} from 'react-icons/md';
import type { Question } from './lib/store';

   /**
    * 1) A simple server-side fetch to your Python backend
    *    to load all questions.
    */
   async function getAllQuestionsFromBackend(): Promise<Question[]> {
     try {
       // You can set fetch options to avoid caching if you want fresh data.
       const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/questions`, {
         cache: 'no-store',
         next: { revalidate: 0 } // Skip cache completely
       });

       if (!res.ok) {
         console.error(`Failed to load questions: ${res.status} ${res.statusText}`);
         return [];
       }

       const data = await res.json();
       return data.questions || [];
     } catch (err) {
       console.error('Error fetching questions:', err);
       return [];
     }
   }

   /**
    * 2) A simple card component for the dashboard UI
    */
   function DashboardCard({
     title,
     description,
     icon,
     linkText,
     linkHref,
     count,
     countLabel,
     bgGradient = 'from-blue-500/10 to-purple-500/10',
   }: {
     title: string;
     description: string;
     icon: React.ReactNode;
     linkText: string;
     linkHref: string;
     count?: number;
     countLabel?: string;
     bgGradient?: string;
   }) {
     return (
       <div className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col`}>
         <div className="flex-1">
           <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${bgGradient} mb-4`}>
             <div className="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400">
               {icon}
             </div>
           </div>
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
             {title}
           </h3>
           <p className="text-slate-600 dark:text-slate-300 mb-4">
             {description}
           </p>
           {count !== undefined && (
             <div className="flex items-end mt-auto mb-4">
               <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                 {count}
               </span>
               <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                 {countLabel}
               </span>
             </div>
           )}
         </div>
         <Link
           href={linkHref}
           className="flex items-center justify-between w-full px-4 py-2 mt-auto bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors"
         >
           {linkText}
           <MdOutlineArrowForward />
         </Link>
       </div>
     );
   }

   /**
    * 3) The default export is our server-rendered homepage.
    *    We do NOT call Zustand or `useStore()` here at all.
    */
   export default async function HomePage() {
     // Fetch all questions from the Python backend
     let questions = await getAllQuestionsFromBackend();

     // Basic stats
     const totalQuestions = questions.length;
     const draftCount = questions.filter((q) => q.status === 'Draft').length;
     const herschrevenCount = questions.filter((q) => q.status === 'Herschreven').length;
     const definitiefCount = questions.filter((q) => q.status === 'Definitief').length;

     // If you want transcript count, you could fetch them from an endpoint.
     // For now, let's just define an empty array:
     const transcripts: any[] = [];

     return (
       <div className="space-y-6">
         {/* Heading */}
         <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
           <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
             Dashboard
           </h1>
           <p className="text-slate-600 dark:text-slate-300">
             Welkom bij LLMinister, uw assistent voor het beantwoorden van parlementaire vragen.
           </p>
         </div>

         {/* Dashboard Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <DashboardCard
             title="Parlementaire Vragen"
             description="Bekijk en beheer alle geëxtraheerde vragen en genereer conceptantwoorden."
             icon={<MdOutlineQuestionAnswer className="text-xl" />}
             linkText="Bekijk alle vragen"
             linkHref="/vragen"
             bgGradient="from-blue-500/10 to-blue-600/10"
             count={totalQuestions}
             countLabel="Vragen"
           />
           <DashboardCard
             title="Video Transcriptie"
             description="Upload een video van een debat en extraheer automatisch de parlementaire vragen."
             icon={<MdOutlineVideoLibrary className="text-xl" />}
             linkText="Nieuwe transcriptie"
             linkHref="/transcriptie"
             bgGradient="from-purple-500/10 to-purple-600/10"
             count={transcripts.length}
             countLabel="Transcripties"
           />
           <DashboardCard
             title="Instellingen"
             description="Configureer API-sleutels en andere instellingen van de applicatie."
             icon={<MdOutlineSettings className="text-xl" />}
             linkText="Beheer instellingen"
             linkHref="/instellingen"
             bgGradient="from-slate-500/10 to-slate-600/10"
           />
         </div>

         {/* Status Overview */}
         {totalQuestions > 0 && (
           <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
             <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
               Status Overzicht
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                 <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                   {draftCount}
                 </span>
                 <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
                   Concept antwoorden
                 </p>
               </div>
               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                 <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                   {herschrevenCount}
                 </span>
                 <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
                   Herschreven antwoorden
                 </p>
               </div>
               <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                 <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                   {definitiefCount}
                 </span>
                 <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                   Definitieve antwoorden
                 </p>
               </div>
             </div>
           </div>
         )}
       </div>
     );
   }