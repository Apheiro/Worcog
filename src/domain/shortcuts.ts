import { z } from 'zod';

export type ShortcutPlatform = 'windows' | 'macos';
const key = '(?:[A-Z0-9]|F(?:[1-9]|1[0-9]|2[0-4])|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|PageUp|PageDown)';
const binding = z.string().regex(new RegExp(`^(?:|(?:(?:Ctrl|Alt|Meta|Shift)\\+)+${key}|F(?:[1-9]|1[0-9]|2[0-4]))$`));
export const shortcutProfileSchema = z.object({
  previousDocument: binding,
  nextDocument: binding,
  focusNotifications: binding,
  contextMenu: binding,
  selectFileModifier: z.enum(['Ctrl', 'Meta', 'Alt', 'Shift']),
}).superRefine((profile, ctx) => {
  const keys = [profile.previousDocument, profile.nextDocument, profile.focusNotifications, profile.contextMenu].filter(Boolean);
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', message: 'Each action needs a different shortcut.' });
});
export type ShortcutProfile = z.infer<typeof shortcutProfileSchema>;
export type ShortcutAction = Exclude<keyof ShortcutProfile, 'selectFileModifier'>;
export const defaultShortcuts: Record<ShortcutPlatform, ShortcutProfile> = {
  windows: { previousDocument: 'Ctrl+ArrowLeft', nextDocument: 'Ctrl+ArrowRight', focusNotifications: 'Alt+T', contextMenu: 'Shift+F10', selectFileModifier: 'Ctrl' },
  macos: { previousDocument: 'Alt+Meta+ArrowLeft', nextDocument: 'Alt+Meta+ArrowRight', focusNotifications: 'Alt+T', contextMenu: 'Shift+F10', selectFileModifier: 'Meta' },
};
export const shortcutActions: { id: ShortcutAction; label: string; scope: string }[] = [
  { id: 'previousDocument', label: 'Previous document', scope: 'While a document viewer is open' },
  { id: 'nextDocument', label: 'Next document', scope: 'While a document viewer is open' },
  { id: 'focusNotifications', label: 'Focus notifications', scope: 'Worcog interface' },
  { id: 'contextMenu', label: 'Open actions menu', scope: 'Focused task or topic, with Context menus enabled' },
];
export function shortcutLabel(binding: string, platform: ShortcutPlatform) {
  return binding.replaceAll('Meta', platform === 'macos' ? 'Command' : 'Win').replaceAll('Alt', platform === 'macos' ? 'Option' : 'Alt').replaceAll('Arrow', '').replaceAll('+', ' + ');
}
