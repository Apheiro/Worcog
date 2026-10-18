'use client';
import { Checkbox } from './checkbox';
import { IconArrowUpRight } from '@tabler/icons-react';
import type { FormEvent } from 'react';
import { updateAttachmentLinks } from '../application/workspace';
import { formatTimestamp } from '../domain/dates';
import type { Attachment, Source, Workspace } from '../domain/model';
import { sourceTopicIds } from '../domain/relationships';
import type { Workbench } from '../infrastructure/use-workspace';
import { Badge, Button, Modal, human } from './ui';
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
  const tasks = w.tasks.filter((t) => t.sourceIds.includes(source.id));
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
        <Badge>{human(source.kind)}</Badge>
        <span className="muted [color:var(--muted)]">{source.platform}</span>
        <Button className="ml-auto" onClick={edit}>
          Edit / link topics
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
        <dt>Identifier</dt>
        <dd>{source.identifier || 'Not provided'}</dd>
        <dt>Event</dt>
        <dd>{formatTimestamp(source.eventAt)}</dd>
        <dt>Participants</dt>
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
      {tasks.length ? (
        tasks.map((t) => (
          <p className="my-2" key={t.id}>
            {t.title} · {human(t.status)}
          </p>
        ))
      ) : (
        <p className="muted [color:var(--muted)] my-3">No linked tasks.</p>
      )}
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
export function FileRelationships({
  file,
  wb,
  close,
  onDelete,
}: {
  file: Attachment;
  onDelete: () => void;
  wb: Workbench;
  close: () => void;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ids = (name: string) => form.getAll(name).map(String);
    if (
      await wb.update((w) =>
        updateAttachmentLinks(w, file.id, {
          topicIds: ids('topicIds'),
          taskIds: ids('taskIds'),
          sourceIds: ids('sourceIds'),
          activityIds: ids('activityIds'),
        }),
      )
    )
      close();
  }
  const groups = [
    { name: 'topicIds', title: 'Topics', items: wb.workspace.topics },
    { name: 'taskIds', title: 'Tasks', items: wb.workspace.tasks },
    { name: 'sourceIds', title: 'Sources', items: wb.workspace.sources },
    {
      name: 'activityIds',
      title: 'Annotations',
      items: wb.workspace.activities.map((a) => ({ id: a.id, title: a.text.slice(0, 100) })),
    },
  ] as const;
  return (
    <Modal title="File relationships" description={file.originalName} onClose={close}>
      <form onSubmit={submit}>
        {wb.error && (
          <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mb-5">
            {wb.error}
          </p>
        )}
        {groups.map((group) => (
          <fieldset
            className="checks [border:1px_solid_var(--border)] [border-radius:4px] [padding:9px_12px_12px] [margin:0_0_18px] min-w-0 [&_legend]:[font-size:11px] [&_legend]:[color:var(--muted)] [&_legend]:[padding:0_5px]"
            key={group.name}
          >
            <legend>{group.title}</legend>
            <div className="check-list [max-height:145px] overflow-auto flex flex-col [gap:6px] [&_label]:flex [&_label]:items-start [&_label]:[gap:8px] [&_label]:[font-size:12px] [&_label]:[overflow-wrap:anywhere] [&_.checkbox]:[margin-top:2px]">
              {group.items.map((item) => (
                <label key={item.id}>
                  <Checkbox
                    name={group.name}
                    value={item.id}
                    defaultChecked={file[group.name].includes(item.id)}
                  />
                  <span>{item.title}</span>
                </label>
              ))}
              {!group.items.length && (
                <p className="muted [color:var(--muted)] text-sm">No items yet.</p>
              )}
            </div>
          </fieldset>
        ))}
        <p className="muted [color:var(--muted)] text-sm">
          Removing links keeps the managed copy on disk. Files with no links remain available in the
          Files view.
        </p>
        <div className="form-footer flex [justify-content:flex-end] [gap:9px] [margin-top:24px] [padding-top:18px] [border-top:1px_solid_var(--border)]">
          <Button
            type="button"
            tone="danger"
            className="mr-auto"
            disabled={wb.busy}
            onClick={onDelete}
          >
            Delete file
          </Button>
          <Button type="button" onClick={close}>
            Cancel
          </Button>
          <Button tone="primary" disabled={wb.busy}>
            Save relationships
          </Button>
        </div>
      </form>
    </Modal>
  );
}
