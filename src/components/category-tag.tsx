'use client';
import { useWorcog } from '../providers/worcog';

export function CategoryTag({ category }: { category: string }) {
  const { w } = useWorcog();
  return <span style={{ color: w.categoryColors?.[category] ?? 'var(--muted)' }}>{category}</span>;
}
