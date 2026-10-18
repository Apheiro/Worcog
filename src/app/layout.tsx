import { Suspense } from 'react';
import Worklog from '../components/worklog';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import { Notifications } from '../components/notifications';
import { themeInitializationScript } from '../infrastructure/theme';
export const metadata: Metadata = {
  title: 'Worklog · Personal operations',
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
          <Worklog>
            {/* asddassad */}
            {children}
          </Worklog>
        </Suspense>
        <Notifications />
      </body>
    </html>
  );
}
