import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

export const reminderPreferencesSchema = z.object({
  trayEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
  volume: z.number().int().min(1).max(100),
  sound: z.object({ name: z.string(), managedName: z.string() }).nullable(),
});
export const reminderStatusSchema = z.object({
  preferences: reminderPreferencesSchema,
  pending: z.array(z.object({ id: z.string(), title: z.string(), topicTitle: z.string(), at: z.string() })),
  soundError: z.string().nullable(),
  error: z.string().nullable(),
  previewing: z.boolean(),
});
export type ReminderPreferences = z.infer<typeof reminderPreferencesSchema>;
export type ReminderStatus = z.infer<typeof reminderStatusSchema>;
export const defaultReminderStatus: ReminderStatus = {
  preferences: { trayEnabled: false, notificationsEnabled: false, volume: 25, sound: null },
  pending: [], soundError: null, error: null, previewing: false,
};
export const reminderApi = {
  status: async () => reminderStatusSchema.parse(await invoke('reminder_status')),
  savePreferences: async (input: Omit<ReminderPreferences, 'sound'>) => reminderPreferencesSchema.parse(await invoke('set_reminder_preferences', { input })),
  chooseSound: async () => reminderPreferencesSchema.nullable().parse(await invoke('choose_reminder_sound')),
  resetSound: async () => reminderPreferencesSchema.parse(await invoke('reset_reminder_sound')),
  preview: (stop: boolean) => invoke<void>('preview_reminder_sound', { stop }),
  ready: () => invoke<void>('reminder_window_ready'),
  setExitGuard: (open: boolean) => invoke<void>('set_exit_guard', { open }),
  dismiss: (id: string, at: string) => invoke<void>('dismiss_reminder', { id, at }),
  openTask: (id: string) => invoke<void>('open_reminder_task', { id }),
};
