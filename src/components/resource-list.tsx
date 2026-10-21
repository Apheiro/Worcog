'use client';
import type { ReactNode } from 'react';
import { IconArrowUpRight, IconTrash } from '@tabler/icons-react';
import { Button, Card, Empty } from './core';
import { formatDate } from '../domain/dates';

export type ResourceListItem = {
  id: string;
  title: string;
  icon: ReactNode;
  metadata: string;
  description?: string;
  date: string;
  tasks: ReactNode;
  onOpen: () => void;
  onDetails: () => void;
  onDelete: () => void;
};

export function ResourceList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: ResourceListItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!items.length) return <Empty title={emptyTitle}>{emptyDescription}</Empty>;
  return (
    <Card asChild>
      <ul className="resource-list m-0 list-none p-0">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 p-4 [border-bottom:1px_solid_var(--border)] last:border-b-0 hover:[background:var(--surface-soft)]"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded [border:1px_solid_var(--border)] [background:var(--surface-soft)] [color:var(--muted)]"
            >
              {item.icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <Button
                tone="link"
                size="auto"
                className="text-[13px] font-[550]"
                onClick={item.onOpen}
              >
                {item.title}
              </Button>
              <span className="text-[11px] [color:var(--muted)] [overflow-wrap:anywhere]">
                {item.metadata}
              </span>
              {item.description && (
                <span className="line-clamp-2 text-xs [color:var(--muted)] [overflow-wrap:anywhere]">
                  {item.description}
                </span>
              )}
              {item.tasks}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-xs [color:var(--muted)]">{formatDate(item.date)}</span>
              <Button
                size="sm"
                aria-label={`View details of ${item.title}`}
                onClick={item.onDetails}
              >
                <IconArrowUpRight size={17} />
              </Button>
              <Button size="sm" aria-label={`Delete ${item.title}`} onClick={item.onDelete}>
                <IconTrash size={16} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
