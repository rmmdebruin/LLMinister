import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LLMinister - Parlementaire Vragen Assistent',
  description: 'Een AI-assistent voor het beantwoorden van parlementaire vragen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.className} h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex h-full">
            <Navigation />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="max-w-6xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
