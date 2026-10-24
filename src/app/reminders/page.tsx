'use client';

import { IconBellRinging, IconX } from '@tabler/icons-react';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { Button, ScrollArea } from '../../components/core';
import { formatTimestamp } from '../../domain/dates';
import { desktopAvailable, errorMessage } from '../../infrastructure/native';
import { defaultReminderStatus, reminderApi, reminderStatusSchema } from '../../infrastructure/reminders';
import { subscribeToTheme } from '../../infrastructure/theme';

export default function Page() {
  const [status, setStatus] = useState(defaultReminderStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const stopTheme = subscribeToTheme(() => {});
    if (!desktopAvailable()) { setError('Reminders require the Worcog desktop application.'); return stopTheme; }
    let disposed = false;
    let stop: (() => void) | undefined;
    let received = 0;
    void listen<unknown>('reminders-changed', ({ payload }) => {
      const parsed = reminderStatusSchema.safeParse(payload);
      if (!disposed && parsed.success) { received++; setStatus(parsed.data); }
    }).then(async (unlisten) => {
      if (disposed) { unlisten(); return; }
      stop = unlisten;
      const version = received;
      const value = await reminderApi.status();
      if (!disposed) {
        if (version === received) setStatus(value);
        await reminderApi.ready();
      }
    }).catch((cause) => { if (!disposed) setError(errorMessage(cause)); });
    return () => { disposed = true; stop?.(); stopTheme(); };
  }, []);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return (
    <main id="main-content" className="flex h-dvh min-h-0 flex-col overflow-hidden [background:var(--surface)] [color:var(--ink)] [border:1px_solid_var(--border-strong)]">
      <header className="flex shrink-0 items-center gap-2 px-4 py-3 [border-bottom:1px_solid_var(--border)]">
        <IconBellRinging size={17} aria-hidden="true" />
        <h1 className="flex-1 text-sm font-semibold">Worcog reminders</h1>
        <span className="text-xs [color:var(--muted)]">{status.pending.length}</span>
      </header>
      <ScrollArea label="Pending reminders" className="min-h-0 flex-1">
        <div className="flex flex-col">
          {(error || status.error || status.soundError) && <p role="alert" className="px-4 py-2 text-xs [color:var(--warning-ink)]">{error || status.error || status.soundError}</p>}
          <div aria-live="polite" aria-atomic="true" className="sr-only">{status.pending.length} pending reminders. Dismiss each reminder to stop its alert.</div>
          {status.pending.map((alert) => (
            <section key={`${alert.id}:${alert.at}`} aria-label={alert.title} className="flex items-start gap-2 px-4 py-3 [border-bottom:1px_solid_var(--border)] last:border-b-0">
              <Button tone="ghost" size="auto" className="min-w-0 flex-1 flex-col gap-1 p-0 [&.button]:items-start [&.button]:text-left [&.button]:justify-start [&.button:hover]:bg-transparent" disabled={busy} onClick={() => void perform(() => reminderApi.openTask(alert.id))}>
                <span className="text-[10px] font-normal [color:var(--muted)] [overflow-wrap:anywhere]">{alert.topicTitle}</span>
                <span className="text-sm [overflow-wrap:anywhere]">{alert.title}</span>
                <time dateTime={alert.at} className="text-xs font-normal [color:var(--secondary)]">{formatTimestamp(alert.at)}</time>
              </Button>
              <Button tone="ghost" size="icon" aria-label={`Dismiss reminder for ${alert.title}`} title="Dismiss reminder" disabled={busy} onClick={() => void perform(async () => {
                await reminderApi.dismiss(alert.id, alert.at);
                setStatus((current) => ({ ...current, pending: current.pending.filter((item) => item.id !== alert.id || item.at !== alert.at) }));
              })}><IconX size={16} aria-hidden="true" /></Button>
            </section>
          ))}
        </div>
      </ScrollArea>
      <p className="shrink-0 px-4 py-2 text-[10px] [color:var(--muted)] [border-top:1px_solid_var(--border)]">Dismiss every reminder to stop the sound.</p>
    </main>
  );
}
