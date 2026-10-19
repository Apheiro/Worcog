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
import { Select } from './core';
import { selectOptions } from '../domain/options';

export function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    getServerThemePreference,
  );
  return (
    <label className="theme-control inline-flex items-center [gap:6px] [color:var(--muted)] [&_.select-trigger]:[padding:5px_8px] [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[min-height:30px]">
      <IconMoon size={16} aria-hidden="true" />
      <span className="sr-only absolute [width:1px] [height:1px] p-0 overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap border-0">
        Color theme
      </span>
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
