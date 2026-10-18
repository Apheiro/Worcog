'use client';
import {
  IconArrowUpRight,
  IconEdit,
  IconFile,
  IconLink,
  IconPaperclip,
  IconTrash,
  IconUnlink,
} from '@tabler/icons-react';
import { useState } from 'react';
import { topicTimeline } from '../application/queries';
import { orderTasksForDisplay } from '../application/task-order';
import { formatDate, formatTimestamp, today } from '../domain/dates';
import type { ActivityKind, Attachment, Source, Topic, Workspace } from '../domain/model';
import { Badge, Button, Empty, Options, Select, activityKinds, human } from './ui';
import { TaskRow, type TaskRowProps } from './task-row';
export function TopicTable({ topics, open }: { topics: Topic[]; open: (id: string) => void }) {
  return topics.length ? (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Topic / next action</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Owner</th>
            <th>Target</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr key={topic.id}>
              <td>
                <button className="title-link" onClick={() => open(topic.id)}>
                  {topic.title}
                </button>
                <div className="row-subtitle">
                  {topic.category} {topic.tags.length > 0 && `· ${topic.tags.join(', ')}`}
                </div>
                {topic.nextAction && <div className="row-action">Next: {topic.nextAction}</div>}
              </td>
              <td>
                <Badge tone={topic.status === 'blocked' ? 'warning' : 'neutral'}>
                  {human(topic.status)}
                </Badge>
              </td>
              <td>
                <Badge tone={topic.priority === 'urgent' ? 'danger' : 'neutral'}>
                  {human(topic.priority)}
                </Badge>
              </td>
              <td>{topic.owner || 'Unassigned'}</td>
              <td
                className={
                  topic.targetDate &&
                  topic.targetDate < today() &&
                  !['completed', 'canceled'].includes(topic.status)
                    ? 'overdue'
                    : ''
                }
              >
                {formatDate(topic.targetDate)}
              </td>
              <td className="muted">{formatDate(topic.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="No matching topics">Create a topic or adjust the filters.</Empty>
  );
}
export function TaskList({
  tasks,
  workspace: w,
  onEdit,
  onStatus,
  busy,
  onAddSubtask,
  onDelete,
  onOpenSource,
  onOpenFile,
  showContext = true,
}: Omit<TaskRowProps, 'task'> & { tasks: TaskRowProps['task'][] }) {
  return tasks.length ? (
    <div className="task-list">
      {orderTasksForDisplay(tasks).map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          workspace={w}
          onEdit={onEdit}
          onStatus={onStatus}
          busy={busy}
          onAddSubtask={onAddSubtask}
          onDelete={onDelete}
          onOpenSource={onOpenSource}
          onOpenFile={onOpenFile}
          showContext={showContext}
        />
      ))}
    </div>
  ) : (
    <Empty title="No tasks in this view">Tasks added to a topic will appear here.</Empty>
  );
}
export function SourceList({
  sources,
  onOpen,
  onDelete,
}: {
  sources: Source[];
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return sources.length ? (
    <div className="source-list">
      {sources.map((source) => (
        <div className="source-row" key={source.id}>
          <span className="entity-icon">
            <IconLink size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <button className="title-link" onClick={() => onOpen(source.id)}>
              <strong>{source.title}</strong>
            </button>
            <span className="row-subtitle">
              {human(source.kind)} · {source.platform || 'Manual reference'}
              {source.identifier && ` · ${source.identifier}`}
            </span>
            <span className="row-subtitle truncate">{source.notes}</span>
          </span>
          <span className="muted text-sm">{formatDate(source.eventAt)}</span>
          <Button size="sm" aria-label={`View ${source.title}`} onClick={() => onOpen(source.id)}>
            <IconArrowUpRight size={17} />
          </Button>
          <Button
            size="sm"
            aria-label={`Delete source ${source.title}`}
            onClick={() => onDelete(source.id)}
          >
            <IconTrash size={16} />
          </Button>
        </div>
      ))}
    </div>
  ) : (
    <Empty title="No references yet">
      Record an email, ticket, conversation or document manually.
    </Empty>
  );
}
export function Timeline({
  workspace: w,
  topicId,
  onEdit,
  onSource,
  onDelete,
}: {
  workspace: Workspace;
  topicId: string;
  onDelete: (kind: 'source' | 'activity', id: string) => void;
  onEdit: (id: string) => void;
  onSource: (id: string) => void;
}) {
  const [kind, setKind] = useState<ActivityKind | ''>('');
  const [sourceId, setSourceId] = useState('');
  const entries = topicTimeline(w, topicId, { kind, sourceId });
  return (
    <>
      <div className="toolbar">
        <label className="sr-only" htmlFor="timeline-kind">
          Activity type
        </label>
        <Select
          id="timeline-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as ActivityKind | '')}
        >
          <option value="">All event types</option>
          <Options values={activityKinds} />
        </Select>
        <label className="sr-only" htmlFor="timeline-source">
          Source
        </label>
        <Select id="timeline-source" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">All sources</option>
          {w.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
        <span className="muted text-sm ml-auto">Oldest first · event date</span>
      </div>
      {entries.length ? (
        <ol className="timeline">
          {entries.map((entry) => {
            const annotation = w.activities.find(
              (a) => entry.type === 'activity' && a.id === entry.id,
            );
            return (
              <li key={`${entry.type}-${entry.id}`}>
                <div className="timeline-dot">
                  {entry.type === 'source' ? <IconLink size={16} /> : <IconEdit size={16} />}
                </div>
                <div className="timeline-body">
                  <div className="flex items-center gap-3 flex-wrap">
                    <time dateTime={entry.eventAt}>{formatTimestamp(entry.eventAt)}</time>
                    <Badge>
                      {entry.type === 'source' ? 'External reference' : human(entry.title)}
                    </Badge>
                    <Button
                      size="sm"
                      className="ml-auto"
                      aria-label={
                        entry.type === 'source' ? `View ${entry.title}` : 'Edit annotation'
                      }
                      onClick={() =>
                        entry.type === 'source' ? onSource(entry.id) : onEdit(entry.id)
                      }
                    >
                      {entry.type === 'source' ? 'View source' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      aria-label={
                        entry.type === 'source'
                          ? `Delete source ${entry.title}`
                          : 'Delete annotation'
                      }
                      onClick={() => onDelete(entry.type, entry.id)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                  {entry.type === 'source' && <h3 className="mt-2">{entry.title}</h3>}
                  <p className="whitespace-pre-wrap mt-2">{entry.text}</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {entry.sourceIds.map((id) => {
                      const source = w.sources.find((s) => s.id === id);
                      return (
                        source && (
                          <button className="source-chip" key={id} onClick={() => onSource(id)}>
                            <IconLink size={13} />
                            {source.title}
                            {source.identifier && ` · ${source.identifier}`}
                          </button>
                        )
                      );
                    })}
                    {!entry.sourceIds.length && (
                      <span className="muted text-xs">Origin: manually recorded internal note</span>
                    )}
                  </div>
                  {annotation && annotation.taskIds.length > 0 && (
                    <p className="row-subtitle mt-2">
                      Tasks:{' '}
                      {annotation.taskIds
                        .map((id) => w.tasks.find((t) => t.id === id)?.title)
                        .join(', ')}
                    </p>
                  )}
                  {entry.eventAt !== entry.createdAt && (
                    <p className="row-subtitle mt-3">Recorded {formatTimestamp(entry.createdAt)}</p>
                  )}
                  {annotation && annotation.revisions.length > 0 && (
                    <details className="text-sm mt-3">
                      <summary>
                        {annotation.revisions.length} previous correction(s) · Updated{' '}
                        {formatTimestamp(annotation.updatedAt)}
                      </summary>
                      {annotation.revisions.map((revision, i) => (
                        <blockquote key={i} className="revision">
                          <span className="muted">
                            Revised {formatTimestamp(revision.revisedAt)}
                          </span>
                          <p className="whitespace-pre-wrap">{revision.text}</p>
                        </blockquote>
                      ))}
                    </details>
                  )}
                  {w.attachments
                    .filter((f) =>
                      entry.type === 'activity'
                        ? f.activityIds.includes(entry.id)
                        : f.sourceIds.includes(entry.id),
                    )
                    .map((f) => (
                      <span className="row-subtitle inline-icon" key={f.id}>
                        <IconPaperclip size={13} />
                        {f.originalName}
                      </span>
                    ))}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <Empty title="The story starts here">
          Add an annotation with its event date, or link an external reference.
        </Empty>
      )}
    </>
  );
}
export function FileList({
  files,
  open,
  manage,
  unlink,
  onDelete,
}: {
  files: Attachment[];
  onDelete: (id: string) => void;
  open: (id: string) => void;
  manage: (id: string) => void;
  unlink?: (id: string) => void;
}) {
  return files.length ? (
    <div>
      {files.map((file) => (
        <div key={file.id} className="file-row">
          <IconFile size={20} />
          <div className="flex-1 min-w-0">
            <button className="title-link" onClick={() => open(file.id)}>
              {file.originalName}
            </button>
            <div className="row-subtitle">
              {(file.size / 1024).toFixed(1)} KB · {file.mime || 'Unknown type'} · Added{' '}
              {formatDate(file.addedAt)}
            </div>
          </div>
          <Button size="sm" onClick={() => manage(file.id)}>
            Relationships
          </Button>
          <Button
            size="sm"
            aria-label={`Delete file ${file.originalName}`}
            onClick={() => onDelete(file.id)}
          >
            <IconTrash size={16} />
          </Button>
          {unlink && (
            <Button
              size="sm"
              aria-label={`Unlink ${file.originalName}`}
              onClick={() => unlink(file.id)}
            >
              <IconUnlink size={16} />
            </Button>
          )}
        </div>
      ))}
    </div>
  ) : (
    <Empty title="No attached files">
      Attach a document to keep a managed copy, independent of the original location.
    </Empty>
  );
}
