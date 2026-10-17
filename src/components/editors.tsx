'use client';
import dayjs from 'dayjs';
import { IconTrash } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import type {
  ActivityKind,
  Priority,
  Source,
  SourceKind,
  Status,
  Task,
  Topic,
  Workspace,
} from '../domain/model';
import * as actions from '../application/workspace';
import { toTimestamp } from '../domain/dates';
import {
  Button,
  Field,
  Modal,
  Options,
  activityKinds,
  human,
  priorities,
  sourceKinds,
  statuses,
} from './ui';
export type Editor = {
  kind: 'topic' | 'task' | 'source' | 'activity';
  id?: string;
  topicId?: string;
  parentId?: string;
};
type Props = {
  editor: Editor;
  workspace: Workspace;
  busy: boolean;
  error?: string;
  openFile: (id: string) => void;
  onClose: () => void;
  onDelete: (kind: Editor['kind'], id: string) => void;
  onSave: (transform: (w: Workspace) => Workspace) => Promise<boolean>;
};
const tags = (value: string) => [
  ...new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
const localTime = (date?: string) => dayjs(date).format('YYYY-MM-DDTHH:mm');
function Checks({
  title,
  name,
  options,
  selected,
}: {
  title: string;
  name: string;
  options: { id: string; title: string }[];
  selected: string[];
}) {
  return (
    <fieldset className="checks">
      <legend>{title}</legend>
      {options.length ? (
        <div className="check-list">
          {options.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                name={name}
                value={option.id}
                defaultChecked={selected.includes(option.id)}
              />
              <span>{option.title}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No items available yet.</p>
      )}
    </fieldset>
  );
}
export function EntityEditor({
  editor,
  workspace: w,
  busy,
  error,
  openFile,
  onClose,
  onDelete,
  onSave,
}: Props) {
  const topic = w.topics.find((x) => x.id === editor.id);
  const task = w.tasks.find((x) => x.id === editor.id);
  const source = w.sources.find((x) => x.id === editor.id);
  const activity = w.activities.find((x) => x.id === editor.id);
  const item =
    editor.kind === 'topic'
      ? topic
      : editor.kind === 'task'
        ? task
        : editor.kind === 'source'
          ? source
          : activity;
  const [taskTopic, setTaskTopic] = useState(
    task?.topicId ?? editor.topicId ?? w.topics.find((t) => !t.archived)?.id ?? '',
  );
  const [reuse, setReuse] = useState('');
  const [titleText, setTitleText] = useState(source?.title ?? '');
  const [identifierText, setIdentifierText] = useState(source?.identifier ?? '');
  const matches =
    !editor.id && editor.kind === 'source'
      ? w.sources.filter(
          (s) =>
            (identifierText.trim() &&
              s.identifier.toLowerCase() === identifierText.trim().toLowerCase()) ||
            (titleText.trim() && s.title.toLowerCase().includes(titleText.trim().toLowerCase())),
        )
      : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? '').trim();
    const many = (name: string) => data.getAll(name).map(String);
    const nullable = (name: string) => get(name) || null;
    const common = {
      title: get('title'),
      status: get('status') as Status,
      priority: get('priority') as Priority,
      owner: get('owner'),
      tags: tags(get('tags')),
    };
    const transform = (current: Workspace): Workspace => {
      if (editor.kind === 'topic') {
        const input = {
          ...common,
          summary: get('summary'),
          category: get('category'),
          participants: get('participants'),
          nextAction: get('nextAction'),
          targetDate: nullable('targetDate'),
          relatedTopicIds: many('relatedTopicIds'),
        };
        return editor.id
          ? actions.updateTopic(current, editor.id, input)
          : actions.createTopic(current, input);
      }
      if (editor.kind === 'task') {
        const input = {
          ...common,
          topicId: get('topicId'),
          description: get('description'),
          parentId: nullable('parentId'),
          startDate: nullable('startDate'),
          dueDate: nullable('dueDate'),
          nextAction: get('nextAction'),
          sourceIds: many('sourceIds'),
          recurrence: get('recurrence') as Task['recurrence'],
        };
        return editor.id
          ? actions.updateTask(current, editor.id, input)
          : actions.createTask(current, input);
      }
      if (editor.kind === 'source') {
        if (reuse) {
          const existing = current.sources.find((s) => s.id === reuse);
          if (!existing) throw new Error('Choose an existing source.');
          return actions.updateSource(current, reuse, {
            topicIds: [...new Set([...existing.topicIds, ...many('topicIds')])],
          });
        }
        const input = {
          title: get('title'),
          kind: get('kind') as SourceKind,
          platform: get('platform'),
          identifier: get('identifier'),
          url: get('url'),
          eventAt: toTimestamp(get('eventAt')),
          participants: get('participants'),
          notes: get('notes'),
          tags: tags(get('tags')),
          topicIds: many('topicIds'),
        };
        const duplicate = current.sources.find(
          (s) =>
            s.id !== editor.id &&
            ((input.identifier &&
              s.identifier.toLowerCase() === input.identifier.toLowerCase() &&
              s.platform.toLowerCase() === input.platform.toLowerCase()) ||
              (input.url && s.url === input.url)),
        );
        if (duplicate && !data.has('allowDuplicate'))
          throw new Error(
            `A source with this identifier or link already exists: “${duplicate.title}”. Reuse it from the selector, or explicitly allow a separate reference.`,
          );
        return editor.id
          ? actions.updateSource(current, editor.id, input)
          : actions.createSource(current, input);
      }
      const input = {
        text: get('text'),
        kind: get('kind') as ActivityKind,
        eventAt: toTimestamp(get('eventAt')),
        topicIds: many('topicIds'),
        taskIds: many('taskIds'),
        sourceIds: many('sourceIds'),
      };
      return editor.id
        ? actions.updateActivity(current, editor.id, input)
        : actions.createActivity(current, input);
    };
    if (await onSave(transform)) onClose();
  }
  return (
    <Modal
      title={`${editor.id ? 'Edit' : 'New'} ${editor.kind === 'activity' ? 'annotation' : editor.kind}`}
      description={
        editor.kind === 'activity'
          ? 'Use the actual event date. The time you record this entry is preserved separately.'
          : undefined
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        {error && <p className="notice mb-5">{error}</p>}
        {editor.kind === 'source' && !editor.id && w.sources.length > 0 && (
          <Field
            label="Reuse an existing reference"
            hint="Select a saved source to associate it with these topics, without duplicating it."
          >
            <select value={reuse} onChange={(e) => setReuse(e.target.value)}>
              <option value="">Create a new source</option>
              {w.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.identifier && `· ${s.identifier}`}
                </option>
              ))}
            </select>
          </Field>
        )}
        {!reuse && (
          <>
            {editor.kind !== 'activity' && (
              <Field label="Title">
                <input
                  name="title"
                  required
                  maxLength={500}
                  autoFocus
                  defaultValue={(item as Topic | Task | Source | undefined)?.title}
                  onChange={(e) => setTitleText(e.target.value)}
                />
              </Field>
            )}
            {(editor.kind === 'topic' || editor.kind === 'task') && (
              <>
                <div className="form-grid">
                  <Field label="Status">
                    <select
                      name="status"
                      defaultValue={(item as Topic | Task | undefined)?.status ?? 'pending'}
                    >
                      <Options values={statuses} />
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select
                      name="priority"
                      defaultValue={(item as Topic | Task | undefined)?.priority ?? 'normal'}
                    >
                      <Options values={priorities} />
                    </select>
                  </Field>
                </div>
                <Field label="Owner">
                  <input name="owner" defaultValue={(item as Topic | Task | undefined)?.owner} />
                </Field>
              </>
            )}
            {editor.kind === 'topic' && (
              <>
                <Field label="Category">
                  <input
                    name="category"
                    defaultValue={topic?.category ?? 'General'}
                    list="categories"
                  />
                  <datalist id="categories">
                    {[
                      ...new Set([
                        'Project',
                        'Incident',
                        'Vulnerability',
                        'Request',
                        'Improvement',
                        'Vendor follow-up',
                        ...w.topics.map((t) => t.category),
                      ]),
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </datalist>
                </Field>
                <Field label="Summary">
                  <textarea name="summary" rows={4} defaultValue={topic?.summary} />
                </Field>
                <Field label="Participants">
                  <input name="participants" defaultValue={topic?.participants} />
                </Field>
                <div className="form-grid">
                  <Field label="Next action">
                    <input name="nextAction" defaultValue={topic?.nextAction} />
                  </Field>
                  <Field label="Target date">
                    <input type="date" name="targetDate" defaultValue={topic?.targetDate ?? ''} />
                  </Field>
                </div>
                <Checks
                  title="Related topics"
                  name="relatedTopicIds"
                  options={w.topics.filter((t) => t.id !== topic?.id)}
                  selected={topic?.relatedTopicIds ?? []}
                />
              </>
            )}
            {editor.kind === 'task' && (
              <>
                <div className="form-grid">
                  <Field label="Topic">
                    <select
                      name="topicId"
                      value={taskTopic}
                      onChange={(e) => setTaskTopic(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Choose a topic
                      </option>
                      {w.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Parent task">
                    <select name="parentId" defaultValue={task?.parentId ?? editor.parentId ?? ''}>
                      <option value="">No parent</option>
                      {w.tasks
                        .filter((t) => t.topicId === taskTopic && t.id !== task?.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea name="description" rows={3} defaultValue={task?.description} />
                </Field>
                <div className="form-grid">
                  <Field label="Start date">
                    <input type="date" name="startDate" defaultValue={task?.startDate ?? ''} />
                  </Field>
                  <Field label="Due date">
                    <input type="date" name="dueDate" defaultValue={task?.dueDate ?? ''} />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field label="Repeat">
                    <select name="recurrence" defaultValue={task?.recurrence ?? 'none'}>
                      <Options values={['none', 'daily', 'weekly', 'monthly']} />
                    </select>
                  </Field>
                  <Field label="Next action">
                    <input name="nextAction" defaultValue={task?.nextAction} />
                  </Field>
                </div>
                <p className="muted text-sm mb-4">
                  Recurring tasks create separate instances through today. Monthly series keep the
                  original day, clamped to the end of shorter months. Cancel the original task to
                  stop a series.
                </p>
                <Checks
                  title="Linked sources"
                  name="sourceIds"
                  options={w.sources}
                  selected={task?.sourceIds ?? []}
                />
              </>
            )}
            {(editor.kind === 'activity' || editor.kind === 'source') && (
              <div className="form-grid">
                <Field label="Type">
                  <select
                    name="kind"
                    defaultValue={
                      (editor.kind === 'activity' ? activity?.kind : source?.kind) ??
                      (editor.kind === 'activity' ? 'note' : 'email')
                    }
                  >
                    <Options values={editor.kind === 'activity' ? activityKinds : sourceKinds} />
                  </select>
                </Field>
                <Field label="Event date and time (local)">
                  <input
                    type="datetime-local"
                    name="eventAt"
                    required
                    defaultValue={localTime(
                      editor.kind === 'activity' ? activity?.eventAt : source?.eventAt,
                    )}
                  />
                </Field>
              </div>
            )}
            {editor.kind === 'activity' && (
              <>
                <Field
                  label="Annotation"
                  hint="Plain text; line breaks are preserved. Corrections keep earlier text in history."
                >
                  <textarea name="text" rows={6} required autoFocus defaultValue={activity?.text} />
                </Field>
                <Checks
                  title="Sources / origin"
                  name="sourceIds"
                  options={w.sources.map((s) => ({
                    id: s.id,
                    title: `${human(s.kind)} · ${s.title}${s.identifier ? ` · ${s.identifier}` : ''}`,
                  }))}
                  selected={activity?.sourceIds ?? []}
                />
                <Checks
                  title="Related tasks"
                  name="taskIds"
                  options={w.tasks.filter((t) => !editor.topicId || t.topicId === editor.topicId)}
                  selected={activity?.taskIds ?? []}
                />
                {activity && (
                  <p className="muted text-sm">
                    Created {dayjs(activity.createdAt).format('MMM D, YYYY HH:mm')}.{' '}
                    {activity.revisions.length} previous correction(s).
                  </p>
                )}
              </>
            )}
            {editor.kind === 'source' && (
              <>
                <div className="form-grid">
                  <Field label="System / platform">
                    <input
                      name="platform"
                      defaultValue={source?.platform}
                      placeholder="Outlook, Teams, InvGate…"
                    />
                  </Field>
                  <Field label="External identifier">
                    <input
                      name="identifier"
                      defaultValue={source?.identifier}
                      onChange={(e) => setIdentifierText(e.target.value)}
                      placeholder="Ticket number, message ID…"
                    />
                  </Field>
                </div>
                <Field
                  label="Original link (optional)"
                  hint="HTTP, HTTPS or msteams link. No account connection is made."
                >
                  <input name="url" defaultValue={source?.url} placeholder="https://…" />
                </Field>
                <Field label="Participants / sender">
                  <input name="participants" defaultValue={source?.participants} />
                </Field>
                <Field label="Context">
                  <textarea name="notes" rows={3} defaultValue={source?.notes} />
                </Field>
                {matches.length > 0 && (
                  <p className="notice">
                    Similar references exist: {matches.map((s) => s.title).join(', ')}. Consider
                    reusing a saved source.
                  </p>
                )}
                <label className="check-inline mb-4">
                  <input type="checkbox" name="allowDuplicate" /> Allow a separate source even if
                  the identifier or link matches
                </label>
              </>
            )}
            {editor.kind !== 'activity' && (
              <Field label="Labels" hint="Separate labels with commas.">
                <input
                  name="tags"
                  defaultValue={(item as Topic | Task | Source | undefined)?.tags.join(', ')}
                />
              </Field>
            )}
          </>
        )}
        {(editor.kind === 'activity' || editor.kind === 'source') && (
          <Checks
            title="Linked topics"
            name="topicIds"
            options={w.topics}
            selected={
              (editor.kind === 'activity' ? activity?.topicIds : source?.topicIds) ??
              (editor.topicId ? [editor.topicId] : [])
            }
          />
        )}
        {editor.id && editor.kind !== 'topic' && (
          <section className="mt-5">
            <h3>Related files</h3>
            {w.attachments
              .filter((f) =>
                editor.kind === 'task'
                  ? f.taskIds.includes(editor.id ?? '')
                  : editor.kind === 'source'
                    ? f.sourceIds.includes(editor.id ?? '')
                    : f.activityIds.includes(editor.id ?? ''),
              )
              .map((f) => (
                <Button type="button" size="sm" key={f.id} onClick={() => openFile(f.id)}>
                  {f.originalName}
                </Button>
              ))}
            <p className="muted text-xs mt-2">Associate documents from Files → Relationships.</p>
          </section>
        )}
        <div className="form-footer">
          {item && editor.id && (
            <Button
              type="button"
              tone="danger"
              className="mr-auto"
              disabled={busy}
              onClick={() => onDelete(editor.kind, item.id)}
            >
              <IconTrash size={16} /> Delete{' '}
              {editor.kind === 'activity' ? 'annotation' : editor.kind}
            </Button>
          )}
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button tone="primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : reuse ? 'Link source' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
