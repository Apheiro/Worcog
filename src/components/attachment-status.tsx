'use client';
import { useTranslations } from 'next-intl';
import { useWorcog } from '../providers/worcog';

export function AttachmentStatus({ id }: { id: string }) {
  const tr = useTranslations('ui');
  const { attachmentAccess } = useWorcog();
  const status = attachmentAccess.statuses[id];
  if (!status || status === 'available') return null;
  return (
    <span className="text-xs [color:var(--muted)]">
      {' '}
      · {status === 'missing' ? tr('file_not_found') : tr('inaccessible')}
    </span>
  );
}
