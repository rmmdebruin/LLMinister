'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MdClose,
  MdDarkMode,
  MdHome,
  MdLightMode,
  MdMenu,
  MdOutlineQuestionAnswer,
  MdOutlineSettings,
  MdOutlineVideoLibrary
} from 'react-icons/md';
import { useStore } from '../lib/store';

const Navigation = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Grab the resetData function from store
  const resetData = useStore((state) => state.resetData);

  // Check for dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('darkMode', String(newVal));
    if (newVal) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <MdHome className="text-xl" /> },
    { name: 'Vragen', href: '/vragen', icon: <MdOutlineQuestionAnswer className="text-xl" /> },
    { name: 'Transcriptie', href: '/transcriptie', icon: <MdOutlineVideoLibrary className="text-xl" /> },
    { name: 'Instellingen', href: '/instellingen', icon: <MdOutlineSettings className="text-xl" /> },
  ];

  const handleReset = async () => {
    if (confirm('Weet je zeker dat je alle data wilt verwijderen?')) {
      try {
        await resetData();
        alert('Alle data is gereset.');
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Er is een fout opgetreden bij het resetten van de data.');
      }
    }
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex flex-col h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 w-64 p-4">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LLMinister
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parlementaire Vragen Assistent
          </p>
        </div>
        <div className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleDarkMode}
            className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            {darkMode ? (
              <>
                <MdLightMode className="mr-3 text-xl" />
                <span>Lichte modus</span>
              </>
            ) : (
              <>
                <MdDarkMode className="mr-3 text-xl" />
                <span>Donkere modus</span>
              </>
            )}
          </button>
        </div>
        <div className="pt-4">
          <button
            onClick={handleReset}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Reset Data
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LLMinister
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {darkMode ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <MdClose className="text-xl" /> : <MdMenu className="text-xl" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-16">
            <nav className="p-4">
              <ul className="space-y-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="mr-3 text-2xl">{item.icon}</span>
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
                {/* Reset Data in mobile menu */}
                <li>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      if (confirm('Weet je zeker dat je alle data wilt verwijderen?')) {
                        try {
                          await resetData();
                          alert('Alle data is gereset.');
                        } catch (error) {
                          console.error('Error resetting data:', error);
                          alert('Er is een fout opgetreden bij het resetten van de data.');
                        }
                      }
                    }}
                    className="flex items-center px-4 py-3 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Reset Data
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
};

export default Navigation;
