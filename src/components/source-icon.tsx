'use client';
import { useLabels } from '../i18n/use-labels';
import { useTranslations } from 'next-intl';
import {
  IconCalendarEvent,
  IconLink,
  IconMail,
  IconMessages,
  IconTicket,
} from '@tabler/icons-react';
import type { SourceKind, SourceType } from '../domain/model';
import { sourceKindLabel, sourceType } from '../domain/sources';

const icons = {
  url: IconLink,
  mail: IconMail,
  ticketing: IconTicket,
  meeting: IconCalendarEvent,
  messaging: IconMessages,
} satisfies Record<SourceType, typeof IconLink>;

export function SourceIcon({
  kind,
  size = 16,
  className,
}: {
  kind?: SourceKind;
  size?: number;
  className?: string;
}) {
  const localize = useLabels();
  const tr = useTranslations('ui');
  const type = kind ? sourceType(kind) : undefined;
  const Icon = type ? icons[type] : IconLink;
  return (
    <Icon
      size={size}
      className={className}
      role="img"
      aria-label={kind ? localize(sourceKindLabel(kind)) : tr('source')}
    />
  );
}
