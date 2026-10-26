'use client';
import { useTranslations } from 'next-intl';
import type { topicIndicator } from '../application/topic-inactivity';
import { useDates } from './use-dates';

export function useIndicatorText(indicator: ReturnType<typeof topicIndicator> | null) {
  const tr = useTranslations('ui');
  const { formatDate } = useDates();
  if (!indicator) return '';
  if (indicator.kind === 'deadline')
    return tr('deadline_tooltip', {
      date: formatDate(indicator.date),
      detail:
        indicator.progress === 1
          ? tr('deadline_passed')
          : tr('deadline_elapsed', { percent: Math.round(indicator.progress * 100) }),
    });
  return tr(indicator.excludesWeekdays ? 'inactivity_counted_tooltip' : 'inactivity_tooltip', {
    days: indicator.days,
    threshold: indicator.threshold,
  });
}
