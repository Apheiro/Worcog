'use client';
import { Checkbox } from './checkbox';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState, type FormEvent } from 'react';
import * as actions from '../application/workspace';
import { toTimestamp } from '../domain/dates';
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
import {
  Button,
  Field,
  Input,
  Modal,
  selectOptions,
  Select,
  Textarea,
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
    <fieldset className="checks [border:1px_solid_var(--border)] [border-radius:4px] [padding:9px_12px_12px] [margin:0_0_18px] min-w-0 [&_legend]:[font-size:11px] [&_legend]:[color:var(--muted)] [&_legend]:[padding:0_5px]">
      <legend>{title}</legend>
      {options.length ? (
        <div className="check-list [max-height:145px] overflow-auto flex flex-col [gap:6px] [&_label]:flex [&_label]:items-start [&_label]:[gap:8px] [&_label]:[font-size:12px] [&_label]:[overflow-wrap:anywhere] [&_.checkbox]:[margin-top:2px]">
          {options.map((option) => (
            <label key={option.id}>
              <Checkbox
                name={name}
                value={option.id}
                defaultChecked={selected.includes(option.id)}
              />
              <span>{option.title}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="muted [color:var(--muted)] text-sm">No items available yet.</p>
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
        {error && (
          <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mb-5">
            {error}
          </p>
        )}
        {editor.kind === 'source' && !editor.id && w.sources.length > 0 && (
          <Field
            label="Reuse an existing reference"
            hint="Select a saved source to associate it with these topics, without duplicating it."
          >
            <Select
              value={reuse}
              onValueChange={setReuse}
              options={[
                { value: '', label: 'Create a new source' },
                ...w.sources.map((s) => ({
                  value: s.id,
                  label: s.title + ' ' + (s.identifier && `· ${s.identifier}`),
                })),
              ]}
            />
          </Field>
        )}
        {!reuse && (
          <>
            {editor.kind !== 'activity' && (
              <Field label="Title">
                <Input
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
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="Status">
                    <Select
                      name="status"
                      defaultValue={(item as Topic | Task | undefined)?.status ?? 'pending'}
                      options={selectOptions(statuses)}
                    />
                  </Field>
                  <Field label="Priority">
                    <Select
                      name="priority"
                      defaultValue={(item as Topic | Task | undefined)?.priority ?? 'normal'}
                      options={selectOptions(priorities)}
                    />
                  </Field>
                </div>
                <Field label="Owner">
                  <Input name="owner" defaultValue={(item as Topic | Task | undefined)?.owner} />
                </Field>
              </>
            )}
            {editor.kind === 'topic' && (
              <>
                <Field label="Category">
                  <Input
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
                  <Textarea name="summary" rows={4} defaultValue={topic?.summary} />
                </Field>
                <Field label="Participants">
                  <Input name="participants" defaultValue={topic?.participants} />
                </Field>
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="Next action">
                    <Input name="nextAction" defaultValue={topic?.nextAction} />
                  </Field>
                  <Field label="Target date">
                    <Input type="date" name="targetDate" defaultValue={topic?.targetDate ?? ''} />
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
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="Topic">
                    <Select
                      name="topicId"
                      value={taskTopic}
                      onValueChange={setTaskTopic}
                      required
                      options={[
                        { value: '', label: 'Choose a topic', disabled: true },
                        ...w.topics.map((t) => ({ value: t.id, label: t.title })),
                      ]}
                    />
                  </Field>
                  <Field label="Parent task">
                    <Select
                      name="parentId"
                      defaultValue={task?.parentId ?? editor.parentId ?? ''}
                      options={[
                        { value: '', label: 'No parent' },
                        ...w.tasks
                          .filter((t) => t.topicId === taskTopic && t.id !== task?.id)
                          .map((t) => ({ value: t.id, label: t.title })),
                      ]}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea name="description" rows={3} defaultValue={task?.description} />
                </Field>
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="Start date">
                    <Input type="date" name="startDate" defaultValue={task?.startDate ?? ''} />
                  </Field>
                  <Field label="Due date">
                    <Input type="date" name="dueDate" defaultValue={task?.dueDate ?? ''} />
                  </Field>
                </div>
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="Repeat">
                    <Select
                      name="recurrence"
                      defaultValue={task?.recurrence ?? 'none'}
                      options={selectOptions(['none', 'daily', 'weekly', 'monthly'])}
                    />
                  </Field>
                  <Field label="Next action">
                    <Input name="nextAction" defaultValue={task?.nextAction} />
                  </Field>
                </div>
                <p className="muted [color:var(--muted)] text-sm mb-4">
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
              <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                <Field label="Type">
                  <Select
                    name="kind"
                    defaultValue={
                      (editor.kind === 'activity' ? activity?.kind : source?.kind) ??
                      (editor.kind === 'activity' ? 'note' : 'email')
                    }
                    options={[
                      ...selectOptions(editor.kind === 'activity' ? activityKinds : sourceKinds),
                    ]}
                  />
                </Field>
                <Field label="Event date and time (local)">
                  <Input
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
                  <Textarea name="text" rows={6} required autoFocus defaultValue={activity?.text} />
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
                  <p className="muted [color:var(--muted)] text-sm">
                    Created {dayjs(activity.createdAt).format('MMM D, YYYY HH:mm')}.{' '}
                    {activity.revisions.length} previous correction(s).
                  </p>
                )}
              </>
            )}
            {editor.kind === 'source' && (
              <>
                <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                  <Field label="System / platform">
                    <Input
                      name="platform"
                      defaultValue={source?.platform}
                      placeholder="Outlook, Teams, InvGate…"
                    />
                  </Field>
                  <Field label="External identifier">
                    <Input
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
                  <Input name="url" defaultValue={source?.url} placeholder="https://…" />
                </Field>
                <Field label="Participants / sender">
                  <Input name="participants" defaultValue={source?.participants} />
                </Field>
                <Field label="Context">
                  <Textarea name="notes" rows={3} defaultValue={source?.notes} />
                </Field>
                {matches.length > 0 && (
                  <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px]">
                    Similar references exist: {matches.map((s) => s.title).join(', ')}. Consider
                    reusing a saved source.
                  </p>
                )}
                <label className="check-inline flex items-start [gap:8px] [font-size:12px] [overflow-wrap:anywhere] [&_.checkbox]:[margin-top:2px] mb-4">
                  <Checkbox name="allowDuplicate" /> Allow a separate source even if the identifier
                  or link matches
                </label>
              </>
            )}
            {editor.kind !== 'activity' && (
              <Field label="Labels" hint="Separate labels with commas.">
                <Input
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
            <p className="muted [color:var(--muted)] text-xs mt-2">
              Associate documents from Files → Relationships.
            </p>
          </section>
        )}
        <div className="form-footer flex [justify-content:flex-end] [gap:9px] [margin-top:24px] [padding-top:18px] [border-top:1px_solid_var(--border)]">
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
