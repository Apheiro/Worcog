'use client';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button } from './core';
import { useWorklog } from '../providers/worklog';
import { WorkspaceFilters } from './workspace-filters';
export function WorkspaceSection({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
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
                : page === 'resources'
                  ? 'Sources, managed files and the tasks they belong to.'
                  : page === 'archive'
                    ? 'Preserved topics and their complete history.'
                    : page === 'contacts'
                      ? 'Manage assignees, requesters and their contact details.'
                      : page === 'documentation'
                        ? 'How to use Worklog, its workflows and keyboard shortcuts.'
                      : page === 'search'
                        ? 'Browse your workspace history, newest first. Search or filter any movement.'
                        : 'Appearance, topic activity, storage and application updates.'}
          </p>
        </div>
        {actions ?? (page === 'topics' && (
          <Button tone="primary" onClick={addForPage} disabled={!enabled}>
            <IconPlus size={17} /> New {newItemName}
          </Button>
        ))}
      </div>
      {['topics', 'tasks', 'resources', 'search', 'archive'].includes(page) && (
        <WorkspaceFilters
          key={page}
          page={page}
          workspace={w}
          filter={filter}
          onChange={setFilter}
          onClear={() =>
            setFilters((current) => ({
              ...current,
              [page]:
                page === 'resources' ? { type: filter.type === 'file' ? 'file' : 'source' } : {},
            }))
          }
        />
      )}
      {children}
    </>
  );
}
