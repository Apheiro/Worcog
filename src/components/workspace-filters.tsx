'use client';
import { IconSearch } from '@tabler/icons-react';
import type { Priority, SourceKind, Status, Workspace } from '../domain/model';
import type { SearchFilter } from '../application/queries';
import { Button, Field, Options, priorities, sourceKinds, statuses } from './ui';
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
  return (
    <section className="filters" aria-label="Filters">
      <div className="search-field">
        <IconSearch size={17} />
        <input
          aria-label="Search text"
          placeholder={
            page === 'sources' ? 'Search title, identifier, platform…' : 'Search your work…'
          }
          value={filter.query ?? ''}
          onChange={(e) => setFilter({ query: e.target.value })}
        />
      </div>
      <div className="filter-controls">
        {page === 'search' && (
          <Field label="Entity">
            <select
              value={filter.type ?? ''}
              onChange={(e) => setFilter({ type: e.target.value as SearchFilter['type'] })}
            >
              <option value="">All entities</option>
              <Options values={['topic', 'task', 'activity', 'source']} />
            </select>
          </Field>
        )}
        <Field label="Category">
          <select
            value={filter.category ?? ''}
            onChange={(e) => setFilter({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {[...new Set(w.topics.map((t) => t.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        {page !== 'sources' && (
          <>
            <Field label="Status">
              <select
                value={filter.status ?? ''}
                onChange={(e) => setFilter({ status: e.target.value as Status | '' })}
              >
                <option value="">All statuses</option>
                <Options values={statuses} />
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={filter.priority ?? ''}
                onChange={(e) => setFilter({ priority: e.target.value as Priority | '' })}
              >
                <option value="">All priorities</option>
                <Options values={priorities} />
              </select>
            </Field>
            <Field label="Owner">
              <input
                value={filter.owner ?? ''}
                onChange={(e) => setFilter({ owner: e.target.value })}
                placeholder="Any owner"
              />
            </Field>
          </>
        )}
        {(page === 'sources' || page === 'tasks' || page === 'search') && (
          <Field label="Topic">
            <select
              value={filter.topicId ?? ''}
              onChange={(e) => setFilter({ topicId: e.target.value })}
            >
              <option value="">All topics</option>
              {w.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        {page === 'sources' && (
          <Field label="Source type">
            <select
              value={filter.sourceKind ?? ''}
              onChange={(e) => setFilter({ sourceKind: e.target.value as SourceKind | '' })}
            >
              <option value="">All types</option>
              <Options values={sourceKinds} />
            </select>
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
          <input
            type="date"
            value={filter.from ?? ''}
            onChange={(e) => setFilter({ from: e.target.value })}
          />
        </Field>
        <Field label="To">
          <input
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
