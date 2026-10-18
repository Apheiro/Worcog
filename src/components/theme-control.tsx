'use client';
import { IconMoon } from '@tabler/icons-react';
import { useSyncExternalStore } from 'react';
import {
  getServerThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
  themeOptions,
} from '../infrastructure/theme';
import { selectOptions, Select } from './ui';

export function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    getServerThemePreference,
  );
  return (
    <label className="theme-control">
      <IconMoon size={16} aria-hidden="true" />
      <span className="sr-only">Color theme</span>
      <Select
        aria-label="Color theme"
        value={preference}
        onValueChange={(event) => {
          const selected = themeOptions.find((option) => option === event);
          if (selected) setThemePreference(selected);
        }}
        options={selectOptions(themeOptions)}
      />
    </label>
  );
}
