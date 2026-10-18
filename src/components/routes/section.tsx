'use client';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button } from '../ui';
import { useWorklog } from '../worklog';
import { WorkspaceFilters } from '../workspace-filters';
export function Section({ children }: { children: ReactNode }) {
  const {
    w,
    page,
    setFilters,
    filter,
    setFilter,
    enabled,
    attach,
    heading,
    addForPage,
    newItemName,
  } = useWorklog();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>{heading}</h1>
          <p className="muted">
            {page === 'topics'
              ? 'Every matter, its context, and the next step.'
              : page === 'tasks'
                ? 'Track outcomes, deadlines, and recurring work.'
                : page === 'sources'
                  ? 'Reusable references to the places where work happens.'
                  : page === 'archive'
                    ? 'Preserved topics and their complete history.'
                    : page === 'files'
                      ? 'Managed copies and their relationships across your workspace.'
                      : page === 'search'
                        ? 'Find topics, tasks, annotations and external identifiers.'
                        : 'Persistent data, portable archives and recovery.'}
          </p>
        </div>
        {['topics', 'tasks', 'sources'].includes(page) && (
          <Button
            tone="primary"
            onClick={addForPage}
            disabled={!enabled || (page === 'tasks' && !w.topics.length)}
          >
            <IconPlus size={17} /> New {newItemName}
          </Button>
        )}
        {page === 'files' && (
          <Button
            tone="primary"
            disabled={!enabled}
            onClick={() => {
              void attach();
            }}
          >
            <IconPlus size={17} /> Attach file
          </Button>
        )}
      </div>
      {['topics', 'tasks', 'sources', 'search', 'archive'].includes(page) && (
        <WorkspaceFilters
          key={page}
          page={page}
          workspace={w}
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilters((current) => ({ ...current, [page]: {} }))}
        />
      )}
      {children}
    </>
  );
}
