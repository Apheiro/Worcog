import { Suspense } from 'react';
import { ApplicationShell } from './application-shell';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import { themeInitializationScript } from '../infrastructure/theme';
import { LanguageProvider } from '../providers/language';
import { SkipLink } from './skip-link';
export const metadata: Metadata = {
  title: 'Worcog · Personal operations',
  description: 'A local workspace for topics, evidence, decisions and next actions.',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <LanguageProvider>
          <SkipLink />
          <Suspense fallback={<p role="status">Opening workspace…</p>}>
            <ApplicationShell>{children}</ApplicationShell>
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
