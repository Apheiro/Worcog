'use client';
import { useEffect, useMemo, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { IconActivity, IconFile, IconFolder, IconLink, IconListCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { workspaceHistory, type HistoryEntry } from '../../application/queries';
import { calendarDate, formatDate, formatTimestamp } from '../../domain/dates';
import { Button, Empty } from '../../components/core';
import { useWorklog } from '../../providers/worklog';
import { WorkspaceSection } from '../../components/workspace-section';
import { SourceIcon } from '../../components/source-icon';

const batchSize = 40;
const icons = {
  topic: IconFolder,
  task: IconListCheck,
  activity: IconActivity,
  source: IconLink,
  file: IconFile,
};

export default function Page() {
  const { w, setEditor, setSourceId, setFileId, effective, openTopic } = useWorklog();
  const history = useMemo(() => workspaceHistory(w, effective), [w, effective]);
  const filterKey = JSON.stringify(effective);
  const [pagination, setPagination] = useState({ filterKey, limit: batchSize });
  const limit = pagination.filterKey === filterKey ? pagination.limit : batchSize;
  const hasMore = limit < history.length;
  const { ref, entry } = useIntersection<HTMLDivElement>({ rootMargin: '200px' });
  useEffect(() => {
    if (entry?.isIntersecting && hasMore)
      setPagination((current) => ({
        filterKey,
        limit: (current.filterKey === filterKey ? current.limit : batchSize) + batchSize,
      }));
  }, [entry, hasMore, filterKey]);
  const groups = new Map<string, HistoryEntry[]>();
  for (const movement of history.slice(0, limit)) {
    const date = calendarDate(movement.date);
    const group = groups.get(date) ?? [];
    group.push(movement);
    groups.set(date, group);
  }
  return (
    <WorkspaceSection>
      {history.length ? (
        <div className="max-w-5xl">
          <p className="mb-5 text-xs [color:var(--muted)]" role="status">
            {Math.min(limit, history.length)} of {history.length} movements · newest first
          </p>
          <ol className="m-0 list-none p-0">
            {[...groups].map(([date, movements]) => (
              <li
                key={date}
                className="relative ml-2 pb-7 pl-6 [border-left:1px_solid_var(--border)] last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full [background:var(--canvas)] [border:2px_solid_var(--border-strong)]"
                />
                <h2 className="mb-3 text-xs [color:var(--secondary)]">
                  <time dateTime={date}>{formatDate(date)}</time>
                </h2>
                <ol className="m-0 flex list-none flex-col p-0">
                  {movements.map((movement, index) => {
                    const Icon = icons[movement.type];
                    const context = movement.topicIds
                      .map((id) => w.topics.find((topic) => topic.id === id)?.title)
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <li key={movement.key}>
                        <Button
                          type="button"
                          tone="ghost"
                          size="auto"
                          className="w-full gap-3 px-2 py-3 [&.button]:items-start [&.button]:justify-start [&.button]:text-left [&.button]:border-0 [&.button]:rounded-none"
                          onClick={() => {
                            if (movement.type === 'topic') openTopic(movement.id);
                            else if (movement.type === 'source') setSourceId(movement.id);
                            else if (movement.type === 'file') setFileId(movement.id);
                            else if (movement.type === 'task') setEditor({ kind: 'task', id: movement.id });
                            else {
                              const topicId = movement.topicIds[0];
                              if (topicId) openTopic(topicId);
                            }
                          }}
                        >
                          <time
                            dateTime={movement.date}
                            title={formatTimestamp(movement.date)}
                            className="w-9 shrink-0 pt-0.5 text-[11px] tabular-nums [color:var(--muted)]"
                          >
                            {dayjs(movement.date).format('HH:mm')}
                          </time>
                          {movement.type === 'source' ? <SourceIcon
                            kind={w.sources.find((source) => source.id === movement.id)?.kind}
                            size={16}
                            className="mt-0.5 shrink-0 [color:var(--muted)]"
                          /> : <Icon
                            size={16}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 [color:var(--muted)]"
                          />}
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-[10px] [color:var(--muted)] uppercase tracking-wide">
                              {movement.action === 'activity'
                                ? 'Activity'
                                : movement.action === 'created'
                                  ? `Created ${movement.type}`
                                  : `Last updated ${movement.type}`}
                            </span>
                            <span className="text-[13px] font-medium [overflow-wrap:anywhere]">
                              {movement.title}
                            </span>
                            {movement.text && (
                              <span className="line-clamp-2 text-xs [color:var(--muted)] [overflow-wrap:anywhere]">
                                {movement.text}
                              </span>
                            )}
                            {context && movement.type !== 'topic' && (
                              <span className="text-[11px] [color:var(--muted)] [overflow-wrap:anywhere]">
                                {context}
                              </span>
                            )}
                          </span>
                        </Button>
                        {index < movements.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="mx-auto block h-px w-[92%] [background:var(--border)]"
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
          {hasMore && (
            <div ref={ref} className="flex justify-center py-6">
              <Button
                size="sm"
                onClick={() => setPagination({ filterKey, limit: limit + batchSize })}
              >
                Load older movements
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Empty title="No movements found">Try another phrase or adjust the filters.</Empty>
      )}
    </WorkspaceSection>
  );
}
