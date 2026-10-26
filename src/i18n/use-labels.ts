'use client';

import { useTranslations } from 'next-intl';
import en from './en.json';

const keys = new Map(Object.entries(en.ui).map(([key, message]) => [message, key]));

/** Translate application-owned labels from shared option lists, never user data. */
export function useLabels() {
  const translate = useTranslations('ui');
  return (label: string) => {
    const key = keys.get(label);
    return key ? translate(key) : label;
  };
}
