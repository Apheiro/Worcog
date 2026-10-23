import { IconCalendarEvent, IconLink, IconMail, IconMessages, IconTicket } from '@tabler/icons-react';
import type { SourceKind, SourceType } from '../domain/model';
import { sourceKindLabel, sourceType } from '../domain/sources';

const icons = {
  mail: IconMail,
  ticketing: IconTicket,
  meeting: IconCalendarEvent,
  messaging: IconMessages,
} satisfies Record<SourceType, typeof IconLink>;

export function SourceIcon({ kind, size = 16, className }: { kind?: SourceKind; size?: number; className?: string }) {
  const type = kind ? sourceType(kind) : undefined;
  const Icon = type ? icons[type] : IconLink;
  return <Icon size={size} className={className} role="img" aria-label={kind ? sourceKindLabel(kind) : 'Source'} />;
}
