'use client';
import { useTranslations } from 'next-intl';

import { useWorcog } from '../providers/worcog';
import { Button, Card } from './core';

/** Keep dismissal reachable if the native popup could not be presented. */
export function ReminderFallback() {
  const tr = useTranslations('ui');
  const { reminders } = useWorcog();
  const { status, busy } = reminders;
  if (!status.error || !status.pending.length) return null;
  return (
    <Card
      role="alert"
      className="fixed right-5 z-60 w-96 max-w-[calc(100vw-40px)] p-4 [box-shadow:0_4px_16px_#0002]"
      style={{ bottom: 'calc(20px + var(--worcog-dock-height, 0px))' }}
    >
      <h2 className="mb-2 text-sm"> {tr('pending_reminders')} </h2>
      <p className="mb-3 text-xs [color:var(--warning-ink)]">{status.error}</p>
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
        {status.pending.map((alert) => (
          <div key={`${alert.id}:${alert.at}`} className="flex items-start gap-2">
            <Button
              tone="link"
              size="auto"
              className="min-w-0 flex-1 text-xs"
              disabled={busy}
              onClick={() => void reminders.openTask(alert.id)}
            >
              {alert.title}
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void reminders.dismiss(alert.id, alert.at)}
            >
              {' '}
              {tr('dismiss')}{' '}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
