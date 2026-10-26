'use client';

import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

/** Both guides are rendered at build time; switching language needs no request. */
export function GuideContent({ en, es }: { en: ReactNode; es: ReactNode }) {
  const locale = useLocale();
  return (
    <section
      lang={locale}
      aria-label={locale === 'es' ? 'Guía de usuario de Worcog' : 'Worcog user guide'}
    >
      {locale === 'es' ? es : en}
    </section>
  );
}
