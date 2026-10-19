'use client';
import { IconArrowUpRight } from '@tabler/icons-react';
import { formatTimestamp } from '../domain/dates';
import type { Attachment, Source, Workspace } from '../domain/model';
import { sourceTopicIds } from '../domain/relationships';
import type { Workbench } from '../infrastructure/use-workspace';
import { Badge, Button, Modal } from './core';
import { sourceKindLabel, sourceType, sourceParticipantLabel } from '../domain/sources';
import { human } from '../domain/options';
import { ResourceTasks } from './resource-tasks';
import { FileList } from './work-lists';
export function SourceDetail({
  source,
  w,
  error,
  close,
  edit,
  openTopic,
  openOriginal,
  openFile,
  manageFile,
  onDelete,
  deleteFile,
}: {
  source: Source;
  onDelete: () => void;
  deleteFile: (id: string) => void;
  error?: string;
  w: Workspace;
  close: () => void;
  edit: () => void;
  openTopic: (id: string) => void;
  openOriginal: () => void;
  openFile: (id: string) => void;
  manageFile: (id: string) => void;
}) {
  const topicIds = sourceTopicIds(w, source);
  const annotations = w.activities.filter((a) => a.sourceIds.includes(source.id));
  return (
    <Modal title={source.title} onClose={close} wide>
      {error && (
        <p
          className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mb-4"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Badge>{sourceKindLabel(source.kind)}</Badge>
        <span className="muted [color:var(--muted)]">{source.platform}</span>
        <Button className="ml-auto" onClick={edit}>
          Edit metadata
        </Button>
        <Button tone="danger" onClick={onDelete}>
          Delete source
        </Button>
        {source.url && (
          <Button tone="primary" onClick={openOriginal}>
            Open original <IconArrowUpRight size={16} />
          </Button>
        )}
      </div>
      <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0">
        {sourceType(source.kind) === 'mail' && source.subject && (
          <>
            <dt>Subject</dt>
            <dd>{source.subject}</dd>
          </>
        )}
        <dt>Identifier</dt>
        <dd>{source.identifier || 'Not provided'}</dd>
        <dt>Event</dt>
        <dd>{formatTimestamp(source.eventAt)}</dd>
        <dt>{sourceParticipantLabel(source)}</dt>
        <dd>{source.participants || 'Not provided'}</dd>
        <dt>Original link</dt>
        <dd className="break-all">
          {source.url || 'No link provided — use the saved metadata to locate the original.'}
        </dd>
        <dt>Recorded</dt>
        <dd>{formatTimestamp(source.createdAt)}</dd>
      </dl>
      <p className="whitespace-pre-wrap my-5">{source.notes}</p>
      <h3>Related topics</h3>
      <div className="flex gap-2 flex-wrap my-3">
        {topicIds.map((id) => (
          <Button size="sm" key={id} onClick={() => openTopic(id)}>
            {w.topics.find((t) => t.id === id)?.title}
          </Button>
        ))}
        {!topicIds.length && <p className="muted [color:var(--muted)]">No linked topics.</p>}
      </div>
      <h3 className="mt-5">Annotations citing this source</h3>
      {annotations.length ? (
        annotations.map((a) => (
          <blockquote
            className="revision [border-left:2px_solid_var(--border)] [margin:10px_0] [padding:6px_12px] [background:var(--surface-soft)] [font-size:12px]"
            key={a.id}
          >
            <time className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
              {formatTimestamp(a.eventAt)} · {human(a.kind)}
            </time>
            <p className="whitespace-pre-wrap">{a.text}</p>
          </blockquote>
        ))
      ) : (
        <p className="muted [color:var(--muted)] my-3">No annotations cite this source yet.</p>
      )}
      <h3 className="mt-5">Linked tasks</h3>
      <ResourceTasks sourceId={source.id} />
      <h3 className="mt-5">Files</h3>
      <FileList
        onDelete={deleteFile}
        files={w.attachments.filter((f) => f.sourceIds.includes(source.id))}
        open={openFile}
        manage={manageFile}
      />
    </Modal>
  );
}
export function FileDetail({
  file,
  wb,
  close,
  onDelete,
}: {
  file: Attachment;
  wb: Workbench;
  close: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal title={file.originalName} onClose={close}>
      <p className="text-xs [color:var(--muted)] mb-4">
        {(file.size / 1024).toFixed(1)} KB · {file.mime} · Added {formatTimestamp(file.addedAt)}
      </p>
      <h3 className="text-sm">Linked tasks</h3>
      <ResourceTasks fileId={file.id} />
      <p className="text-xs [color:var(--muted)] mt-4">
        Manage resource relationships from the task editor. Unlinking a saved file preserves its
        managed copy.
      </p>
      {wb.error && (
        <p role="alert" className="text-xs [color:var(--danger-ink)] mt-4">
          {wb.error}
        </p>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button tone="danger" disabled={wb.busy} onClick={onDelete}>
          Delete file
        </Button>
        <Button onClick={close}>Close</Button>
      </div>
    </Modal>
  );
}
