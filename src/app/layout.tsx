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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <Notifications />
      </body>
    </html>
  );
}
