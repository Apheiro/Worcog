'use client';
import { useWorklog } from '../providers/worklog';

export function CategoryTag({ category }: { category: string }) {
  const { w } = useWorklog();
  return <span style={{ color: w.categoryColors?.[category] ?? 'var(--muted)' }}>{category}</span>;
}
