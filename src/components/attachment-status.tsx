'use client';
import { useWorklog } from '../providers/worklog';

export function AttachmentStatus({ id }: { id: string }) {
  const { attachmentAccess } = useWorklog();
  const status = attachmentAccess.statuses[id];
  if (!status || status === 'available') return null;
  return <span className="text-xs [color:var(--muted)]"> · {status === 'missing' ? 'File not found' : 'Inaccessible'}</span>;
}
