'use client';
import { IconActivity, IconArchive, IconArrowUpRight, IconEdit, IconFile, IconLink, IconPaperclip, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { topicTimeline } from '../application/queries';
import { formatDate, formatTimestamp, today } from '../domain/dates';
import type { ActivityKind, Attachment, Source, Topic, Workspace } from '../domain/model';
import { ActionMenu, Badge, Button, ContextMenu, Empty, Select, type ActionMenuItem } from './core';
import { useWorcog } from '../providers/worcog';
import { sourceKindLabel } from '../domain/sources';
import { selectOptions, activityKinds, human } from '../domain/options';
import { assignedNames } from '../domain/responsibles';
import { TopicInactivityIndicator } from './topic-inactivity-indicator';
import { CategoryTag } from './category-tag';
import { ResourceTasks } from './resource-tasks';
import { ResourceList } from './resource-list';
export { TaskList } from './task-list';
import { AttachmentStatus } from './attachment-status';
import { SourceIcon } from './source-icon';
import { EntityLinks, EntityLinkTarget } from './entity-links';
export function TopicTable({ topics, open, showCategory = true }: { topics: Topic[]; open: (id: string) => void; showCategory?: boolean }) {
  const { taskContextMenu, page, wb, setEditor, askDelete, askArchive, relations, shortcuts } = useWorcog();
  const showActions = page === 'topics' && !taskContextMenu;
  return topics.length ? (
    <div className="table-wrap overflow-auto [border:1px_solid_var(--border)] [border-radius:4px] [background:var(--surface)]">
      <table className="data-table table-fixed [border-collapse:collapse] w-full [min-width:760px] text-left [font-size:12px] [&_th]:[padding:10px_15px] [&_th]:[font-size:10px] [&_th]:[font-weight:600] [&_th]:[color:var(--muted)] [&_th]:[background:var(--surface-soft)] [&_th]:[letter-spacing:0.4px] [&_th]:uppercase [&_th]:[border-bottom:1px_solid_var(--border)] [&_th]:whitespace-nowrap [&_td]:[padding:15px] [&_td]:[border-bottom:1px_solid_var(--border)] [&_td]:[vertical-align:top] [&_td]:[overflow-wrap:anywhere] [&_td:nth-child(5)]:whitespace-nowrap [&_td:nth-child(6)]:whitespace-nowrap [&_tr:last-child_td]:[border-bottom:none] [&_tbody_tr:hover]:[background:var(--surface-soft)]">
        <colgroup>
          <col />
          <col className="w-[110px]" />
          <col className="w-[90px]" />
          <col className="w-[18%]" />
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          {showActions && <col className="w-[52px]" />}
        </colgroup>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignees</th>
            <th>Target</th>
            <th>Updated</th>
            {showActions && <th scope="col"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => {
            const actions: ActionMenuItem[] = [
              { label: 'Link…', icon: <IconLink size={15} />, onSelect: () => relations.start({ kind: 'topic', id: topic.id }) },
              {
                label: 'Edit topic',
                icon: <IconEdit size={15} />,
                opensDialog: true,
                onSelect: () => setEditor({ kind: 'topic', id: topic.id }),
              },
              {
                label: topic.archived ? 'Unarchive' : 'Archive',
                icon: <IconArchive size={15} />,
                opensDialog: true,
                onSelect: () => askArchive(topic.id),
              },
              {
                label: 'Delete topic',
                icon: <IconTrash size={15} />,
                destructive: true,
                opensDialog: true,
                onSelect: () => askDelete({ kind: 'topic', id: topic.id }),
              },
            ];
            return (
              <ContextMenu
                key={topic.id}
                label={`Actions for ${topic.title}`}
                shortcut={shortcuts.active.contextMenu}
                disabled={!taskContextMenu || page !== 'topics' || wb.busy || !!relations.source}
                items={actions}
              >
                <EntityLinkTarget entity={{ kind: 'topic', id: topic.id }}>
                  <tr>
                    <td className="relative overflow-hidden">
                      <TopicInactivityIndicator topic={topic} edge />
                      <Button tone="link" size="auto" onClick={() => open(topic.id)}>
                        {topic.title}
                      </Button>
                      {relations.source && (
                        <Button data-link-navigate tone="ghost" size="auto" aria-label={`Open ${topic.title} to choose a task`} title="Open topic to choose a task" onClick={() => open(topic.id)} className="ml-2 h-5 w-5 p-0" disabled={wb.busy}>
                          <IconArrowUpRight size={14} aria-hidden="true" />
                        </Button>
                      )}
                      {showCategory && (
                        <div className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                          <CategoryTag category={topic.category} />
                        </div>
                      )}
                      <EntityLinks entity={{ kind: 'topic', id: topic.id }} className="mt-2" />
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
                    <td>{assignedNames(topic).join(', ') || 'Unassigned'}</td>
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
                    {showActions && (
                      <td className="topic-actions [&.topic-actions]:p-2">
                        <ActionMenu label={`Actions for ${topic.title}`} disabled={wb.busy || !!relations.source} items={actions} />
                      </td>
                    )}
                  </tr>
                </EntityLinkTarget>
              </ContextMenu>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="No matching topics">Create a topic or adjust the filters.</Empty>
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
  return (
    <ResourceList
      emptyTitle="No references yet"
      emptyDescription="Create a source from a task to see it here."
      items={sources.map((source) => ({
        id: source.id,
        title: source.title,
        icon: <SourceIcon kind={source.kind} size={18} />,
        metadata: `${sourceKindLabel(source.kind)} · ${source.platform || 'Manual reference'}${source.identifier ? ` · ${source.identifier}` : ''}`,
        description: source.notes,
        date: source.eventAt,
        tasks: <ResourceTasks sourceId={source.id} />,
        onOpen: () => onOpen(source.id),
        onDetails: () => onOpen(source.id),
        onDelete: () => onDelete(source.id),
      }))}
    />
  );
}
export function Timeline({
  workspace: w,
  topicId,
  onSource,
  onDelete,
}: {
  workspace: Workspace;
  topicId: string;
  onDelete: (kind: 'source', id: string) => void;
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
          Newest first · event date
        </span>
      </div>
      {entries.length ? (
        <ol className="timeline list-none [padding:10px_0] m-0 [&_>_li]:relative [&_>_li]:flex [&_>_li]:[gap:17px] [&_>_li]:[padding-bottom:28px] [&_>_li:before]:absolute [&_>_li:before]:[left:16px] [&_>_li:before]:[top:30px] [&_>_li:before]:[bottom:0] [&_>_li:before]:content-empty [&_>_li:before]:[width:1px] [&_>_li:before]:[background:var(--border)] [&_>_li:last-child:before]:hidden">
          {entries.map((entry) => {
            const activity = w.activities.find(
              (a) => entry.type === 'activity' && a.id === entry.id,
            );
            return (
              <li key={`${entry.type}-${entry.id}`}>
                <div className="timeline-dot [width:33px] [height:33px] grid [place-items:center] [border:1px_solid_var(--border)] [background:var(--surface-soft)] [border-radius:50%] [color:var(--muted)] shrink-0 [z-index:1]">
                  {entry.type === 'source' ? <SourceIcon kind={w.sources.find((source) => source.id === entry.id)?.kind} size={16} /> : <IconActivity size={16} />}
                </div>
                <div className="timeline-body [border:1px_solid_var(--border)] [background:var(--surface)] [border-radius:5px] flex-1 [padding:15px_18px] min-w-0 [&_time]:[font-size:12px] [&_time]:[font-weight:550] [&_time]:[color:var(--muted)] [&_p]:[font-size:13px] [&_p]:[overflow-wrap:anywhere]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <time dateTime={entry.eventAt}>{formatTimestamp(entry.eventAt)}</time>
                    <Badge>
                      {entry.type === 'source' ? 'External reference' : human(entry.title)}
                    </Badge>
                    {entry.type === 'source' && (
                      <>
                        <Button size="sm" className="ml-auto" aria-label={`View ${entry.title}`} onClick={() => onSource(entry.id)}>
                          View source
                        </Button>
                        <Button size="sm" aria-label={`Delete source ${entry.title}`} onClick={() => onDelete('source', entry.id)}>
                          <IconTrash size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                  {entry.type === 'source' && <h3 className="mt-2">{entry.title}</h3>}
                  <p className="whitespace-pre-wrap mt-2">{entry.text}</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {entry.sourceIds.map((id) => {
                      const source = w.sources.find((s) => s.id === id);
                      return (
                        source && (
                          <Button tone="chip" size="auto" key={id} onClick={() => onSource(id)}>
                            <SourceIcon kind={source.kind} size={13} />
                            {source.title}
                            {source.identifier && ` · ${source.identifier}`}
                          </Button>
                        )
                      );
                    })}
                    {!entry.sourceIds.length && (
                      <span className="muted [color:var(--muted)] text-xs">
                        Origin: internal activity
                      </span>
                    )}
                  </div>
                  {activity && activity.taskIds.length > 0 && (
                    <p className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] mt-2">
                      Tasks:{' '}
                      {activity.taskIds
                        .map((id) => w.tasks.find((t) => t.id === id)?.title)
                        .join(', ')}
                    </p>
                  )}
                  {entry.eventAt !== entry.createdAt && (
                    <p className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] mt-3">
                      Recorded {formatTimestamp(entry.createdAt)}
                    </p>
                  )}
                  {activity && activity.revisions.length > 0 && (
                    <details className="text-sm mt-3">
                      <summary>
                        {activity.revisions.length} previous correction(s) · Updated{' '}
                        {formatTimestamp(activity.updatedAt)}
                      </summary>
                      {activity.revisions.map((revision, i) => (
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
          Task updates, status changes and linked sources will appear here.
        </Empty>
      )}
    </>
  );
}
export function FileList({
  files,
  open,
  manage,
  onDelete,
}: {
  files: Attachment[];
  onDelete: (id: string) => void;
  open: (id: string) => void;
  manage: (id: string) => void;
}) {
  return (
    <ResourceList
      emptyTitle="No attached files"
      emptyDescription="Attach files from a topic or task to keep managed copies here."
      items={files.map((file) => ({
        id: file.id,
        title: file.originalName,
        icon: <IconFile size={18} />,
        metadata: `${(file.size / 1024).toFixed(1)} KB · ${file.mime || 'Unknown type'}`,
        status: <AttachmentStatus id={file.id} />,
        date: file.addedAt,
        tasks: <ResourceTasks fileId={file.id} />,
        onOpen: () => open(file.id),
        onDetails: () => manage(file.id),
        onDelete: () => onDelete(file.id),
      }))}
    />
  );
}
