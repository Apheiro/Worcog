'use client';

import { useLocale, useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export function useDates() {
  const locale = useLocale();
  const tr = useTranslations('ui');
  return {
    formatDate: (value: string | null) =>
      value ? dayjs(value).locale(locale).format('MMM D, YYYY') : tr('no_date'),
    formatTimestamp: (value: string) => dayjs(value).locale(locale).format('MMM D, YYYY HH:mm'),
  };
}
