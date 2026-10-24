'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { WorcogProvider } from '../providers/worcog';
import { Notifications } from '../components/notifications';
import { WindowFrame } from './window-frame';
import { WorkspaceLayout } from './workspace-layout';

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The isolated native reminder window must not mount workspace controllers.
  if (pathname === '/reminders' || pathname === '/reminders/') return children;
  return <><WindowFrame><WorcogProvider><WorkspaceLayout>{children}</WorkspaceLayout></WorcogProvider></WindowFrame><Notifications /></>;
}
