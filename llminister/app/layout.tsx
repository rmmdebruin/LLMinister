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
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="w-full md:w-64 fixed md:sticky top-0 z-50 md:h-screen overflow-y-auto">
              <Navigation />
            </aside>
            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full md:ml-64">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}