'use client';

import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultReminderStatus, reminderApi, reminderStatusSchema, type ReminderPreferences } from './reminders';
import { desktopAvailable, errorMessage } from './native';
import { notifications } from './notifications';

export function useReminders() {
  const [status, setStatus] = useState(defaultReminderStatus);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const refresh = useCallback(async () => {
    if (!desktopAvailable()) return;
    try { setStatus(await reminderApi.status()); setReady(true); setError(''); }
    catch (cause) { setError(errorMessage(cause)); }
  }, []);
  useEffect(() => {
    if (!desktopAvailable()) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    let received = 0;
    void listen<unknown>('reminders-changed', ({ payload }) => {
      if (disposed) return;
      const parsed = reminderStatusSchema.safeParse(payload);
      if (parsed.success) { received++; setStatus(parsed.data); setReady(true); }
      else setError('Invalid reminder state received.');
    }).then(async (unlisten) => {
      if (disposed) { unlisten(); return; }
      stop = unlisten;
      const version = received;
      const value = await reminderApi.status();
      if (!disposed && version === received) { setStatus(value); setReady(true); }
    }).catch((cause) => { if (!disposed) setError(errorMessage(cause)); });
    return () => { disposed = true; stop?.(); };
  }, []);
  async function perform(action: () => Promise<ReminderPreferences | null | void>) {
    if (locked.current || !desktopAvailable()) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const preferences = await action();
      if (preferences) setStatus((current) => ({ ...current, preferences }));
    } catch (cause) {
      const message = errorMessage(cause); setError(message); notifications.error(message);
    } finally { locked.current = false; setBusy(false); }
  }
  function update(patch: Partial<Omit<ReminderPreferences, 'sound'>>) {
    const preferences = { ...status.preferences, ...patch };
    if (patch.trayEnabled === false) preferences.notificationsEnabled = false;
    return perform(() => reminderApi.savePreferences({ trayEnabled: preferences.trayEnabled, notificationsEnabled: preferences.notificationsEnabled, volume: preferences.volume }));
  }
  return {
    status, ready, busy, error, refresh, update,
    chooseSound: () => perform(reminderApi.chooseSound),
    resetSound: () => perform(reminderApi.resetSound),
    preview: () => perform(() => reminderApi.preview(status.previewing)),
    dismiss: (id: string, at: string) => perform(async () => {
      await reminderApi.dismiss(id, at);
      setStatus((current) => ({ ...current, pending: current.pending.filter((alert) => alert.id !== id || alert.at !== at) }));
    }),
    openTask: (id: string) => perform(() => reminderApi.openTask(id)),
    enabled: ready && status.preferences.trayEnabled && status.preferences.notificationsEnabled,
  };
}
