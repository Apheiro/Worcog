'use client';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button } from './core';
import { useWorklog } from '../providers/worklog';
import { WorkspaceFilters } from './workspace-filters';
export function WorkspaceSection({ children }: { children: ReactNode }) {
  const { w, page, setFilters, filter, setFilter, enabled, heading, addForPage, newItemName } =
    useWorklog();
  return (
    <>
      <div className="page-heading flex items-start justify-between [gap:24px] [margin-bottom:29px] [&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px] [&_>_.button]:[margin-top:22px] [@media(max-width:1150px)]:[&_h1]:[font-size:27px] [@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px] [@media(max-width:800px)]:[&_>_.button]:[margin-top:0] [@media(max-width:800px)]:[&_h1]:[font-size:26px]">
        <div>
          <p className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
            Your workspace
          </p>
          <h1>{heading}</h1>
          <p className="muted [color:var(--muted)]">
            {page === 'topics'
              ? 'Every matter, its context, and the next step.'
              : page === 'tasks'
                ? 'Track outcomes, deadlines, and recurring work.'
                : page === 'sources'
                  ? 'Sources created from tasks and their relationships.'
                  : page === 'archive'
                    ? 'Preserved topics and their complete history.'
                    : page === 'files'
                      ? 'Managed files uploaded from tasks and their relationships.'
                      : page === 'search'
                        ? 'Find topics, tasks, annotations and external identifiers.'
                        : 'Persistent data, portable archives and recovery.'}
          </p>
        </div>
        {page === 'topics' && (
          <Button tone="primary" onClick={addForPage} disabled={!enabled}>
            <IconPlus size={17} /> New {newItemName}
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
