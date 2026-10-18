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
import { Badge, Button, Empty, selectOptions, Select, activityKinds, human } from './ui';
import { TaskRow, type TaskRowProps } from './task-row';
export function TopicTable({ topics, open }: { topics: Topic[]; open: (id: string) => void }) {
  return topics.length ? (
    <div className="table-wrap overflow-auto [border:1px_solid_var(--border)] [border-radius:4px] [background:var(--surface)]">
      <table className="data-table [border-collapse:collapse] w-full [min-width:760px] text-left [font-size:12px] [&_th]:[padding:10px_15px] [&_th]:[font-size:10px] [&_th]:[font-weight:600] [&_th]:[color:var(--muted)] [&_th]:[background:var(--surface-soft)] [&_th]:[letter-spacing:0.4px] [&_th]:uppercase [&_th]:[border-bottom:1px_solid_var(--border)] [&_th]:whitespace-nowrap [&_td]:[padding:15px] [&_td]:[border-bottom:1px_solid_var(--border)] [&_td]:[vertical-align:top] [&_td:first-child]:[width:38%] [&_td:nth-child(5)]:whitespace-nowrap [&_td:nth-child(6)]:whitespace-nowrap [&_tr:last-child_td]:[border-bottom:none] [&_tbody_tr:hover]:[background:var(--surface-soft)]">
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
                <button
                  className="title-link p-0 border-0 [background:transparent] [color:var(--ink)] text-left [font-weight:550] [overflow-wrap:anywhere] [&:hover]:[text-decoration:underline] [&:hover]:[text-underline-offset:3px]"
                  onClick={() => open(topic.id)}
                >
                  {topic.title}
                </button>
                <div className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                  {topic.category} {topic.tags.length > 0 && `· ${topic.tags.join(', ')}`}
                </div>
                {topic.nextAction && (
                  <div className="row-action [font-size:12px] [color:var(--muted)] [margin-top:5px] [max-width:520px] [overflow-wrap:anywhere]">
                    Next: {topic.nextAction}
                  </div>
                )}
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
                  ![
                    'completed [text-decoration:line-through] [color:var(--muted)]',
                    'canceled',
                  ].includes(topic.status)
                    ? 'overdue [color:var(--danger-ink)] [font-weight:550]'
                    : ''
                }
              >
                {formatDate(topic.targetDate)}
              </td>
              <td className="muted [color:var(--muted)]">{formatDate(topic.updatedAt)}</td>
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
    <div className="task-list [border:1px_solid_var(--border)] rounded-lg [background:var(--surface)] overflow-hidden">
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
    <div className="source-list [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden">
      {sources.map((source) => (
        <div
          className="source-row flex items-center [gap:14px] w-full text-left [padding:18px] border-0 [border-bottom:1px_solid_var(--border)] [background:var(--surface)] [&:last-child]:[border-bottom:0] [&:hover]:[background:var(--surface-soft)] [&_strong]:[font-size:13px] [&_strong]:[font-weight:550]"
          key={source.id}
        >
          <span className="entity-icon [width:35px] [height:35px] grid [place-items:center] [background:var(--surface-soft)] [border:1px_solid_var(--border)] [border-radius:5px] [color:var(--muted)]">
            <IconLink size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <button
              className="title-link p-0 border-0 [background:transparent] [color:var(--ink)] text-left [font-weight:550] [overflow-wrap:anywhere] [&:hover]:[text-decoration:underline] [&:hover]:[text-underline-offset:3px]"
              onClick={() => onOpen(source.id)}
            >
              <strong>{source.title}</strong>
            </button>
            <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
              {human(source.kind)} · {source.platform || 'Manual reference'}
              {source.identifier && ` · ${source.identifier}`}
            </span>
            <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] truncate">
              {source.notes}
            </span>
          </span>
          <span className="muted [color:var(--muted)] text-sm">{formatDate(source.eventAt)}</span>
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
      <div className="toolbar flex items-center [gap:10px] [margin:19px_0] [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[padding:6px_9px] [&_.select-trigger]:[max-width:240px] [@media(max-width:800px)]:flex-wrap">
        <label
          className="sr-only absolute [width:1px] [height:1px] p-0 overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap border-0"
          htmlFor="timeline-kind"
        >
          Activity type
        </label>
        <Select
          id="timeline-kind"
          value={kind}
          onValueChange={(e) => setKind(e as ActivityKind | '')}
          options={[{ value: '', label: 'All event types' }, ...selectOptions(activityKinds)]}
        />
        <label
          className="sr-only absolute [width:1px] [height:1px] p-0 overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap border-0"
          htmlFor="timeline-source"
        >
          Source
        </label>
        <Select
          id="timeline-source"
          value={sourceId}
          onValueChange={(e) => setSourceId(e)}
          options={[
            { value: '', label: 'All sources' },
            ...w.sources.map((s) => ({ value: s.id, label: s.title })),
          ]}
        />
        <span className="muted [color:var(--muted)] text-sm ml-auto">
          Oldest first · event date
        </span>
      </div>
      {entries.length ? (
        <ol className="timeline list-none [padding:10px_0] m-0 [&_>_li]:relative [&_>_li]:flex [&_>_li]:[gap:17px] [&_>_li]:[padding-bottom:28px] [&_>_li:before]:absolute [&_>_li:before]:[left:16px] [&_>_li:before]:[top:30px] [&_>_li:before]:[bottom:0] [&_>_li:before]:content-empty [&_>_li:before]:[width:1px] [&_>_li:before]:[background:var(--border)] [&_>_li:last-child:before]:hidden">
          {entries.map((entry) => {
            const annotation = w.activities.find(
              (a) => entry.type === 'activity' && a.id === entry.id,
            );
            return (
              <li key={`${entry.type}-${entry.id}`}>
                <div className="timeline-dot [width:33px] [height:33px] grid [place-items:center] [border:1px_solid_var(--border)] [background:var(--surface-soft)] [border-radius:50%] [color:var(--muted)] shrink-0 [z-index:1]">
                  {entry.type === 'source' ? <IconLink size={16} /> : <IconEdit size={16} />}
                </div>
                <div className="timeline-body [border:1px_solid_var(--border)] [background:var(--surface)] [border-radius:5px] flex-1 [padding:15px_18px] min-w-0 [&_time]:[font-size:12px] [&_time]:[font-weight:550] [&_time]:[color:var(--muted)] [&_p]:[font-size:13px] [&_p]:[overflow-wrap:anywhere]">
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
                          <button
                            className="source-chip inline-flex items-center [gap:5px] [border:1px_solid_var(--border)] [background:var(--surface-soft)] [border-radius:4px] [padding:3px_7px] [font-size:11px] [color:var(--secondary)] text-left [overflow-wrap:anywhere] [&:hover]:[background:var(--hover)]"
                            key={id}
                            onClick={() => onSource(id)}
                          >
                            <IconLink size={13} />
                            {source.title}
                            {source.identifier && ` · ${source.identifier}`}
                          </button>
                        )
                      );
                    })}
                    {!entry.sourceIds.length && (
                      <span className="muted [color:var(--muted)] text-xs">
                        Origin: manually recorded internal note
                      </span>
                    )}
                  </div>
                  {annotation && annotation.taskIds.length > 0 && (
                    <p className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] mt-2">
                      Tasks:{' '}
                      {annotation.taskIds
                        .map((id) => w.tasks.find((t) => t.id === id)?.title)
                        .join(', ')}
                    </p>
                  )}
                  {entry.eventAt !== entry.createdAt && (
                    <p className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] mt-3">
                      Recorded {formatTimestamp(entry.createdAt)}
                    </p>
                  )}
                  {annotation && annotation.revisions.length > 0 && (
                    <details className="text-sm mt-3">
                      <summary>
                        {annotation.revisions.length} previous correction(s) · Updated{' '}
                        {formatTimestamp(annotation.updatedAt)}
                      </summary>
                      {annotation.revisions.map((revision, i) => (
                        <blockquote
                          key={i}
                          className="revision [border-left:2px_solid_var(--border)] [margin:10px_0] [padding:6px_12px] [background:var(--surface-soft)] [font-size:12px]"
                        >
                          <span className="muted [color:var(--muted)]">
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
                      <span
                        className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] inline-icon inline-flex [gap:4px] items-center [margin-left:7px]"
                        key={f.id}
                      >
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
        <div
          key={file.id}
          className="file-row flex items-center [gap:14px] [padding:16px] [border-bottom:1px_solid_var(--border)] [background:var(--surface)] [&_>_svg]:[color:var(--muted)] [@media(max-width:800px)]:flex-wrap"
        >
          <IconFile size={20} />
          <div className="flex-1 min-w-0">
            <button
              className="title-link p-0 border-0 [background:transparent] [color:var(--ink)] text-left [font-weight:550] [overflow-wrap:anywhere] [&:hover]:[text-decoration:underline] [&:hover]:[text-underline-offset:3px]"
              onClick={() => open(file.id)}
            >
              {file.originalName}
            </button>
            <div className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
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
