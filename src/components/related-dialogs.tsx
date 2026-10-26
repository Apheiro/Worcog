'use client';
import { useLabels } from '../i18n/use-labels';
import { useDates } from '../i18n/use-dates';
import { useTranslations } from 'next-intl';
import { IconArrowUpRight } from '@tabler/icons-react';

import type { Attachment, Source, Workspace } from '../domain/model';
import { sourceTopicIds } from '../domain/relationships';
import type { Workbench } from '../infrastructure/use-workspace';
import { Badge, Button, Modal } from './core';
import { sourceKindLabel, sourceType, sourceParticipantLabel } from '../domain/sources';
import { SourceIcon } from './source-icon';
import { ResourceTasks } from './resource-tasks';
import { FileList } from './work-lists';
import { AttachmentStatus } from './attachment-status';
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
  const localize = useLabels();
  const { formatTimestamp } = useDates();
  const tr = useTranslations('ui');
  const topicIds = sourceTopicIds(w, source);
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
        <Badge>
          <SourceIcon kind={source.kind} size={14} />
          {localize(sourceKindLabel(source.kind))}
        </Badge>
        <span className="muted [color:var(--muted)]">{source.platform}</span>
        <Button className="ml-auto" onClick={edit}>
          {tr('edit_metadata')}{' '}
        </Button>
        <Button tone="danger" onClick={onDelete}>
          {tr('delete_source')}{' '}
        </Button>
        {source.url && (
          <Button tone="primary" onClick={openOriginal}>
            {tr('open_original')} <IconArrowUpRight size={16} />
          </Button>
        )}
      </div>
      <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0">
        {sourceType(source.kind) === 'mail' && source.subject && (
          <>
            <dt> {tr('subject')} </dt>
            <dd>{source.subject}</dd>
          </>
        )}
        {sourceType(source.kind) !== 'url' && (
          <>
            <dt>{tr('identifier')}</dt>
            <dd>{source.identifier || tr('not_provided')}</dd>
            <dt>{tr('event')}</dt>
            <dd>{formatTimestamp(source.eventAt)}</dd>
            <dt>{localize(sourceParticipantLabel(source))}</dt>
            <dd>{source.participants || tr('not_provided')}</dd>
          </>
        )}
        <dt> {tr('original_link')} </dt>
        <dd className="break-all">
          {source.url || tr('no_link_provided_use_the_saved_metadata_to_locate_the_original')}
        </dd>
        <dt> {tr('recorded')} </dt>
        <dd>{formatTimestamp(source.createdAt)}</dd>
      </dl>
      <p className="whitespace-pre-wrap my-5">{source.notes}</p>
      <h3> {tr('related_topics')} </h3>
      <div className="flex gap-2 flex-wrap my-3">
        {topicIds.map((id) => (
          <Button size="sm" key={id} onClick={() => openTopic(id)}>
            {w.topics.find((t) => t.id === id)?.title}
          </Button>
        ))}
        {!topicIds.length && (
          <p className="muted [color:var(--muted)]"> {tr('no_linked_topics')} </p>
        )}
      </div>
      <h3 className="mt-5"> {tr('linked_tasks')} </h3>
      <ResourceTasks sourceId={source.id} />
      <h3 className="mt-5"> {tr('files')} </h3>
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
  const { formatTimestamp } = useDates();
  const tr = useTranslations('ui');
  return (
    <Modal
      title={file.originalName}
      onClose={close}
      footer={
        <>
          <Button tone="danger" disabled={wb.busy} onClick={onDelete}>
            {' '}
            {tr('delete_file')}{' '}
          </Button>
          <Button onClick={close}> {tr('close')} </Button>
        </>
      }
    >
      <p className="text-xs [color:var(--muted)] mb-4">
        {(file.size / 1024).toFixed(1)} {tr('kb')} {file.mime} {tr('added')}{' '}
        {formatTimestamp(file.addedAt)}
        <AttachmentStatus id={file.id} />
      </p>
      <h3 className="text-sm"> {tr('linked_topics_and_tasks')} </h3>
      <ResourceTasks fileId={file.id} />
      <p className="text-xs [color:var(--muted)] mt-4">
        {tr(
          'manage_task_resources_from_the_task_editor_and_general_files_from_the_topic_unlinking_a_saved_file_p',
        )}{' '}
      </p>
      {wb.error && (
        <p role="alert" className="text-xs [color:var(--danger-ink)] mt-4">
          {wb.error}
        </p>
      )}
    </Modal>
  );
}
