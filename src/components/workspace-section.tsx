'use client';
import { useLabels } from '../i18n/use-labels';
import { useTranslations } from 'next-intl';
import { IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button } from './core';
import { useWorcog } from '../providers/worcog';
import { WorkspaceFilters } from './workspace-filters';
export function WorkspaceSection({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  const localize = useLabels();
  const tr = useTranslations('ui');
  const { w, page, setFilters, filter, setFilter, enabled, heading, addForPage, newItemName } =
    useWorcog();
  return (
    <>
      <div className="page-heading flex items-start justify-between [gap:24px] [margin-bottom:29px] [&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px] [&_>_.button]:[margin-top:22px] [@media(max-width:1150px)]:[&_h1]:[font-size:27px] [@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px] [@media(max-width:800px)]:[&_>_.button]:[margin-top:0] [@media(max-width:800px)]:[&_h1]:[font-size:26px]">
        <div>
          <p className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
            {tr('your_workspace')}{' '}
          </p>
          <h1>{localize(heading)}</h1>
          <p className="muted [color:var(--muted)]">
            {page === 'topics'
              ? tr('every_matter_its_context_and_the_next_step')
              : page === 'tasks'
                ? tr('track_outcomes_deadlines_and_recurring_work')
                : page === 'resources'
                  ? tr('sources_managed_files_and_the_tasks_they_belong_to')
                  : page === 'archive'
                    ? tr('preserved_topics_and_their_complete_history')
                    : page === 'contacts'
                      ? tr('manage_assignees_requesters_and_their_contact_details')
                      : page === 'documentation'
                        ? tr('how_to_use_worcog_its_workflows_and_keyboard_shortcuts')
                        : page === 'search'
                          ? tr(
                              'browse_your_workspace_history_newest_first_search_or_filter_any_movement',
                            )
                          : tr('appearance_topic_activity_storage_and_application_updates')}
          </p>
        </div>
        {actions ??
          (page === 'topics' && (
            <Button tone="primary" onClick={addForPage} disabled={!enabled}>
              <IconPlus size={17} /> {tr('new')} {localize(newItemName)}
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
