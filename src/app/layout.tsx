import { Suspense } from 'react';
import { ApplicationShell } from './application-shell';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import { themeInitializationScript } from '../infrastructure/theme';
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
        <a
          className="skip-link fixed [top:-100px] [left:240px] [background:var(--surface)] [color:var(--ink)] [z-index:200] [padding:10px] [border:1px_solid] [&:focus]:[top:10px]"
          href="#main-content"
        >
          Skip to content
        </a>
        <Suspense fallback={<p role="status">Opening workspace…</p>}>
          <ApplicationShell>{children}</ApplicationShell>
        </Suspense>
      </body>
    </html>
  );
}
