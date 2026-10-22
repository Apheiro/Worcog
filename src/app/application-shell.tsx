'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { WorklogProvider } from '../providers/worklog';
import { Notifications } from '../components/notifications';
import { WindowFrame } from './window-frame';
import { WorkspaceLayout } from './workspace-layout';

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The isolated native reminder window must not mount workspace controllers.
  if (pathname === '/reminders' || pathname === '/reminders/') return children;
  return <><WindowFrame><WorklogProvider><WorkspaceLayout>{children}</WorkspaceLayout></WorklogProvider></WindowFrame><Notifications /></>;
}
