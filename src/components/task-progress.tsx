'use client';
import { useDates } from '../i18n/use-dates';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState, type FormEvent } from 'react';
import type { Activity, Task } from '../domain/model';
import { createActivity } from '../application/workspace';
import { compareTimestamps } from '../domain/dates';
import { useWorcog } from '../providers/worcog';
import { Button, Field, Modal, Textarea } from './core';

export function TaskProgress({
  task,
  entries,
  regionId,
}: {
  task: Task;
  entries: Activity[];
  regionId: string;
}) {
  const { formatTimestamp } = useDates();
  const tr = useTranslations('ui');
  const ordered = [...entries].sort(
    (a, b) => compareTimestamps(b.createdAt, a.createdAt) || a.id.localeCompare(b.id),
  );
  if (!entries.length) return null;
  return (
    <div
      id={regionId}
      className="relative min-w-0 py-1 pr-2 [padding-left:calc(1.25rem_+_1px_+_1rem)] before:content-empty before:absolute before:-top-[5px] before:bottom-0 before:[left:calc(1.25rem_+_1px)] before:-translate-x-1/2 before:w-px before:[background:var(--border)] before:pointer-events-none"
      role="region"
      aria-label={tr('updates_for_value0', { value0: task.title })}
    >
      <ol className="m-0 list-none p-0">
        {ordered.map((entry) => (
          <li key={entry.id} className="relative pb-4 last:pb-0">
            <div className="relative flex items-center">
              <span
                aria-hidden="true"
                className="absolute -left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full [background:var(--secondary)]"
              />
              <time dateTime={entry.createdAt} className="text-[10px] [color:var(--muted)]">
                {formatTimestamp(entry.createdAt)}
              </time>
            </div>
            <p className="m-0 mt-1 whitespace-pre-wrap text-xs [overflow-wrap:anywhere]">
              {entry.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TaskUpdateForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const tr = useTranslations('ui');
  const { wb } = useWorcog();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const inputId = useId();
  const formId = useId();
  async function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || wb.busy || locked.current) return;
    locked.current = true;
    setSaving(true);
    try {
      const saved = await wb.update(
        (workspace) => {
          const current = workspace.tasks.find((item) => item.id === task.id);
          if (!current) throw new Error(tr('this_task_no_longer_exists'));
          return createActivity(workspace, {
            kind: 'progress',
            text: text.trim(),
            taskIds: [task.id],
            topicIds: [current.topicId],
          });
        },
        {},
        'Update recorded.',
      );
      if (saved) onClose();
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  return (
    <Modal
      title={tr('add_update')}
      description={task.title}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={wb.busy || saving}>
            {' '}
            {tr('cancel')}{' '}
          </Button>
          <Button
            type="submit"
            form={formId}
            tone="primary"
            disabled={wb.busy || saving || !text.trim()}
          >
            {saving ? tr('recording') : tr('add_update')}
          </Button>
        </>
      }
      onClose={() => {
        if (!wb.busy && !locked.current) onClose();
      }}
    >
      <form id={formId} onSubmit={(event) => void record(event)}>
        <Field label={tr('description')}>
          <Textarea
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoFocus
            aria-label={tr('update_description_for_value0', { value0: task.title })}
            placeholder={tr('record_an_update')}
            rows={3}
            maxLength={100000}
            required
            disabled={wb.busy || saving}
          />
        </Field>
      </form>
    </Modal>
  );
}
