'use client';
import { useLabels } from '../i18n/use-labels';
import { useTranslations } from 'next-intl';
import { Card } from './core/card';
import { IconChevronDown, IconFilter, IconSearch } from '@tabler/icons-react';
import { useId, useState } from 'react';
import type { SearchFilter } from '../application/queries';
import type { Priority, SourceKind, Status, Workspace } from '../domain/model';
import { Button, DateInput, Field, Input, Select } from './core';
import {
  selectOptions,
  priorities,
  taskPriorities,
  sourceKinds,
  statuses,
  statusFilter,
} from '../domain/options';
export function WorkspaceFilters({
  page,
  workspace: w,
  filter,
  onChange: setFilter,
  onClear,
}: {
  page: string;
  workspace: Workspace;
  filter: SearchFilter;
  onChange: (patch: Partial<SearchFilter>) => void;
  onClear: () => void;
}) {
  const localize = useLabels();
  const tr = useTranslations('ui');
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();
  const activeCount = Object.entries(filter).filter(
    ([key, value]) => key !== 'query' && !(page === 'resources' && key === 'type') && value?.trim(),
  ).length;
  return (
    <Card className="filters mb-6 [&.card]:overflow-visible" aria-label={tr('search_and_filters')}>
      <div className="filters-header flex items-stretch">
        <div className="search-field flex flex-1 min-w-0 [gap:10px] items-center [padding:3px_15px] [color:var(--muted)] [&_>_svg]:shrink-0 [&_input]:border-0 [&_input]:w-full [&_input]:min-w-0 [&_input]:[padding:10px_0] [&_input]:[background:none]">
          <IconSearch size={17} />
          <Input
            aria-label={tr('search_text')}
            placeholder={
              page === 'resources'
                ? tr('search_resources_filenames_identifiers')
                : tr('search_your_work')
            }
            className="focus:outline-none"
            value={filter.query ?? ''}
            onChange={(e) => setFilter({ query: e.target.value })}
          />
        </div>
        <Button
          className="filters-toggle shrink-0 border-0 [border-left:1px_solid_var(--border)] rounded-none [padding:10px_16px] [&[aria-expanded=true]_.filters-chevron]:[transform:rotate(180deg)]"
          aria-expanded={expanded}
          aria-controls={controlsId}
          onClick={() => setExpanded((open) => !open)}
        >
          <IconFilter size={17} aria-hidden="true" />
          <span> {tr('filters')} </span>
          {activeCount > 0 && (
            <span className="badge inline-flex items-center [background:var(--surface-soft)] [color:var(--secondary)] [border:1px_solid_var(--border)] whitespace-nowrap [font-size:11px] [font-weight:550] [border-radius:4px] [padding:2px_7px] [line-height:1.6]">
              {activeCount} {tr('active')}{' '}
            </span>
          )}
          <IconChevronDown className="filters-chevron" size={17} aria-hidden="true" />
        </Button>
      </div>
      <div
        className="filter-controls [&[hidden]]:hidden [border-top:1px_solid_var(--border)] flex items-end [gap:12px] flex-wrap [padding:14px_16px] [&_.field]:m-0 [&_.field]:[min-width:100px] [&_.field]:[max-width:170px] [&_.field]:flex-1 [&_.field_>_span]:[font-size:10px] [&_.field_>_span]:uppercase [&_.field_>_span]:[letter-spacing:0.5px] [&_.field_>_span]:[color:var(--muted)] [&_input]:[font-size:12px] [&_input]:[min-height:34px] [&_input]:[padding:6px_7px] [&_input]:w-full [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[min-height:34px] [&_.select-trigger]:[padding:6px_7px] [&_.select-trigger]:w-full [@media(max-width:1150px)]:[&_.field]:[min-width:110px] [@media(max-width:800px)]:[&_.field]:[min-width:120px] [@media(max-width:800px)]:[&_.field]:[max-width:none]"
        id={controlsId}
        hidden={!expanded}
      >
        {page === 'search' && (
          <Field label={tr('entity')}>
            <Select
              value={filter.type ?? ''}
              onValueChange={(e) =>
                setFilter({
                  type: e as SearchFilter['type'],
                })
              }
              options={[
                { value: '', label: tr('all_entities') },
                ...selectOptions(['topic', 'task', 'activity', 'source', 'file']).map((option) => ({
                  ...option,
                  label: localize(option.label),
                })),
              ]}
            />
          </Field>
        )}
        <Field label={tr('category')}>
          <Select
            value={filter.category ?? ''}
            onValueChange={(e) => setFilter({ category: e })}
            options={[
              { value: '', label: tr('all_categories') },
              ...[...new Set(w.topics.map((t) => t.category))]
                .filter(Boolean)
                .map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
        {page !== 'resources' && (
          <>
            <Field label={tr('status')}>
              <Select
                value={statusFilter(filter.status)}
                onValueChange={(e) => setFilter({ status: e as Status | '' })}
                options={[
                  { value: '', label: tr('all_statuses') },
                  ...selectOptions(statuses).map((option) => ({
                    ...option,
                    label: localize(option.label),
                  })),
                ]}
              />
            </Field>
            <Field label={tr('priority')}>
              <Select
                value={
                  page === 'tasks' && filter.priority === 'urgent'
                    ? 'high'
                    : (filter.priority ?? '')
                }
                onValueChange={(e) => setFilter({ priority: e as Priority | '' })}
                options={[
                  { value: '', label: tr('all_priorities') },
                  ...selectOptions(page === 'tasks' ? taskPriorities : priorities).map(
                    (option) => ({ ...option, label: localize(option.label) }),
                  ),
                ]}
              />
            </Field>
            <Field label={tr('assignee')}>
              <Input
                value={filter.responsibleName ?? filter.owner ?? ''}
                onChange={(e) => setFilter({ responsibleName: e.target.value, owner: '' })}
                placeholder={tr('any_owner')}
              />
            </Field>
          </>
        )}
        {(page === 'resources' || page === 'tasks' || page === 'search') && (
          <Field label={tr('topic_2')}>
            <Select
              value={filter.topicId ?? ''}
              onValueChange={(e) => setFilter({ topicId: e })}
              options={[
                { value: '', label: tr('all_topics') },
                ...w.topics.map((t) => ({ value: t.id, label: t.title })),
              ]}
            />
          </Field>
        )}
        {page === 'resources' && filter.type !== 'file' && (
          <Field label={tr('source_type')}>
            <Select
              value={filter.sourceKind ?? ''}
              onValueChange={(e) => setFilter({ sourceKind: e as SourceKind | '' })}
              options={[
                { value: '', label: tr('all_types') },
                ...selectOptions(sourceKinds).map((option) => ({
                  ...option,
                  label: localize(option.label),
                })),
              ]}
            />
          </Field>
        )}
        <Field
          label={
            page === 'topics' || page === 'archive'
              ? tr('target_from')
              : page === 'tasks'
                ? tr('due_from')
                : tr('date_from')
          }
        >
          <DateInput value={filter.from ?? ''} onValueChange={(from) => setFilter({ from })} />
        </Field>
        <Field label={tr('to')}>
          <DateInput value={filter.to ?? ''} onValueChange={(to) => setFilter({ to })} />
        </Field>
        <Button size="sm" onClick={onClear}>
          {tr('clear')}{' '}
        </Button>
      </div>
    </Card>
  );
}
