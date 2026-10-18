'use client';
import { IconChevronDown, IconFilter, IconSearch } from '@tabler/icons-react';
import { useId, useState } from 'react';
import type { SearchFilter } from '../application/queries';
import type { Priority, SourceKind, Status, Workspace } from '../domain/model';
import {
  Button,
  Field,
  Input,
  selectOptions,
  priorities,
  Select,
  sourceKinds,
  statuses,
} from './ui';
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
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();
  const activeCount = Object.entries(filter).filter(
    ([key, value]) => key !== 'query' && value?.trim(),
  ).length;
  return (
    <section className="filters" aria-label="Search and filters">
      <div className="filters-header">
        <div className="search-field">
          <IconSearch size={17} />
          <Input
            aria-label="Search text"
            placeholder={
              page === 'sources' ? 'Search title, identifier, platform…' : 'Search your work…'
            }
            className="focus:outline-none"
            value={filter.query ?? ''}
            onChange={(e) => setFilter({ query: e.target.value })}
          />
        </div>
        <Button
          className="filters-toggle"
          aria-expanded={expanded}
          aria-controls={controlsId}
          onClick={() => setExpanded((open) => !open)}
        >
          <IconFilter size={17} aria-hidden="true" />
          <span>Filters</span>
          {activeCount > 0 && <span className="badge">{activeCount} active</span>}
          <IconChevronDown className="filters-chevron" size={17} aria-hidden="true" />
        </Button>
      </div>
      <div className="filter-controls" id={controlsId} hidden={!expanded}>
        {page === 'search' && (
          <Field label="Entity">
            <Select
              value={filter.type ?? ''}
              onValueChange={(e) => setFilter({ type: e as SearchFilter['type'] })}
              options={[
                { value: '', label: 'All entities' },
                ...selectOptions(['topic', 'task', 'activity', 'source']),
              ]}
            />
          </Field>
        )}
        <Field label="Category">
          <Select
            value={filter.category ?? ''}
            onValueChange={(e) => setFilter({ category: e })}
            options={[
              { value: '', label: 'All categories' },
              ...[...new Set(w.topics.map((t) => t.category))].map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
        {page !== 'sources' && (
          <>
            <Field label="Status">
              <Select
                value={filter.status ?? ''}
                onValueChange={(e) => setFilter({ status: e as Status | '' })}
                options={[{ value: '', label: 'All statuses' }, ...selectOptions(statuses)]}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={filter.priority ?? ''}
                onValueChange={(e) => setFilter({ priority: e as Priority | '' })}
                options={[{ value: '', label: 'All priorities' }, ...selectOptions(priorities)]}
              />
            </Field>
            <Field label="Owner">
              <Input
                value={filter.owner ?? ''}
                onChange={(e) => setFilter({ owner: e.target.value })}
                placeholder="Any owner"
              />
            </Field>
          </>
        )}
        {(page === 'sources' || page === 'tasks' || page === 'search') && (
          <Field label="Topic">
            <Select
              value={filter.topicId ?? ''}
              onValueChange={(e) => setFilter({ topicId: e })}
              options={[
                { value: '', label: 'All topics' },
                ...w.topics.map((t) => ({ value: t.id, label: t.title })),
              ]}
            />
          </Field>
        )}
        {page === 'sources' && (
          <Field label="Source type">
            <Select
              value={filter.sourceKind ?? ''}
              onValueChange={(e) => setFilter({ sourceKind: e as SourceKind | '' })}
              options={[{ value: '', label: 'All types' }, ...selectOptions(sourceKinds)]}
            />
          </Field>
        )}
        <Field
          label={
            page === 'topics' || page === 'archive'
              ? 'Target from'
              : page === 'tasks'
                ? 'Due from'
                : 'Date from'
          }
        >
          <Input
            type="date"
            value={filter.from ?? ''}
            onChange={(e) => setFilter({ from: e.target.value })}
          />
        </Field>
        <Field label="To">
          <Input
            type="date"
            value={filter.to ?? ''}
            onChange={(e) => setFilter({ to: e.target.value })}
          />
        </Field>
        <Button size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </section>
  );
}
