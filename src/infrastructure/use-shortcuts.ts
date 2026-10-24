'use client';
import { getHotkeyHandler, useLocalStorage, useOs } from '@mantine/hooks';
import { defaultShortcuts, shortcutProfileSchema, type ShortcutPlatform, type ShortcutProfile } from '../domain/shortcuts';

export function matchesShortcut(event: KeyboardEvent, binding: string) {
  if (!binding || event.repeat || event.isComposing) return false;
  let matched = false;
  getHotkeyHandler([[binding, () => { matched = true; }, { preventDefault: false, usePhysicalKeys: true }]])(event);
  return matched;
}
export function useShortcuts() {
  const os = useOs();
  const platform: ShortcutPlatform = os === 'macos' || os === 'ios' ? 'macos' : 'windows';
  const [profiles, setProfiles] = useLocalStorage<Record<ShortcutPlatform, ShortcutProfile>>({
    key: 'worcog.shortcuts.v1',
    defaultValue: defaultShortcuts,
    deserialize: (value) => {
      try {
        const parsed: unknown = JSON.parse(value ?? '{}');
        const data = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
        return {
          windows: shortcutProfileSchema.safeParse(data.windows).data ?? defaultShortcuts.windows,
          macos: shortcutProfileSchema.safeParse(data.macos).data ?? defaultShortcuts.macos,
        };
      } catch { return defaultShortcuts; }
    },
  });
  const active = profiles[platform];
  return {
    platform, profiles, active,
    save: (target: ShortcutPlatform, profile: ShortcutProfile) => {
      const value = shortcutProfileSchema.parse(profile);
      setProfiles((current) => ({ ...current, [target]: value }));
    },
    matches: (event: KeyboardEvent, action: Exclude<keyof ShortcutProfile, 'selectFileModifier'>) => matchesShortcut(event, active[action]),
    selectsFile: (event: { ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }) => {
      const modifier = active.selectFileModifier;
      return event.ctrlKey === (modifier === 'Ctrl') && event.metaKey === (modifier === 'Meta')
        && event.altKey === (modifier === 'Alt') && event.shiftKey === (modifier === 'Shift');
    },
  };
}
