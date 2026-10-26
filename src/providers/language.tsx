'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { NextIntlClientProvider } from 'next-intl';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

type Language = 'en' | 'es';
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>({
    key: 'worcog.language',
    defaultValue: 'en',
    deserialize: (value) => (value === '"es"' ? 'es' : 'en'),
  });
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <NextIntlClientProvider
        locale={language}
        messages={language === 'es' ? es : en}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required');
  return context;
}
