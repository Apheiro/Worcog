'use client';
import { Checkbox } from './core/checkbox';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState, type FormEvent } from 'react';
import * as actions from '../application/workspace';
import { SourceFields } from './source-fields';
import {
  initialSourcePlatform,
  isSourceType,
  sourceType,
  type SourceFormValues,
} from '../domain/sources';
import { TaskEditor } from './task-editor';
import { ResponsiblePicker } from './responsible-picker';
import { assignedNames, responsibleDirectory } from '../domain/responsibles';
import { toTimestamp } from '../domain/dates';
import type { ActivityKind, Priority, Source, Status, Topic, Workspace } from '../domain/model';
import { Button, DateInput, Field, Input, Modal, MultiSelect, Select, Textarea } from './core';
import { selectOptions, activityKinds, priorities, statuses } from '../domain/options';
export type Editor = {
  kind: 'topic' | 'task' | 'source' | 'activity';
  id?: string;
  topicId?: string;
  parentId?: string;
};
export type EntityEditorProps = {
  editor: Editor;
  workspace: Workspace;
  busy: boolean;
  error?: string;
  openFile: (id: string) => void;
  onClose: () => void;
  onDelete: (kind: Editor['kind'], id: string) => void;
  onSave: (transform: (w: Workspace) => Workspace) => Promise<boolean>;
};
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
export function EntityEditor(props: EntityEditorProps) {
  if (props.editor.kind === 'task') return <TaskEditor {...props} />;
  return <RecordEditor {...props} />;
}
function RecordEditor({
  editor,
  workspace: w,
  busy,
  error,
  onClose,
  onDelete,
  onSave,
}: EntityEditorProps) {
  const topic = w.topics.find((x) => x.id === editor.id);
  const source = w.sources.find((x) => x.id === editor.id);
  const activity = w.activities.find((x) => x.id === editor.id);
  const item = editor.kind === 'topic' ? topic : editor.kind === 'source' ? source : activity;
  const [sourceForm, setSourceForm] = useState<SourceFormValues>(() => ({
    kind: source ? (sourceType(source.kind) ?? '') : '',
    platform: source ? initialSourcePlatform(source) : '',
    identifier: source?.identifier ?? '',
    subject: source?.subject ?? '',
    messageContext: source?.messageContext ?? 'participants',
    url: source?.url ?? '',
    eventAt: source ? localTime(source.eventAt) : '',
    participants: source?.participants ?? '',
    notes: source?.notes ?? '',
  }));
  const [category, setCategory] = useState(topic?.category ?? '');
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const categoryColor =
    categoryColors[category.trim()] ?? w.categoryColors?.[category.trim()] ?? '#64748b';
  const [responsibles, setResponsibles] = useState(topic ? assignedNames(topic) : []);
  const [createdNames, setCreatedNames] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>(topic?.priority ?? 'normal');
  const [targetDate, setTargetDate] = useState(topic?.targetDate ?? '');
  const elevatedPriority = priority === 'high' || priority === 'urgent';
  const targetDateField = (
    <Field label={elevatedPriority ? 'Deadline' : 'Target date'}>
      <DateInput name="targetDate" value={targetDate} onValueChange={setTargetDate} />
    </Field>
  );
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
      responsibleNames: responsibles,
    };
    const transform = (current: Workspace): Workspace => {
      if (editor.kind === 'topic') {
        current = {
          ...current,
          responsibleNames: [...new Set([...responsibleDirectory(current), ...createdNames])],
          categoryColors: {
            ...current.categoryColors,
            ...(get('category') ? { [get('category')]: categoryColor } : {}),
          },
        };
        const input = {
          ...common,
          summary: get('summary'),
          category: get('category'),
          targetDate: nullable('targetDate'),
        };
        return editor.id
          ? actions.updateTopic(current, editor.id, input)
          : actions.createTopic(current, input);
      }
      if (editor.kind === 'source') {
        if (!isSourceType(sourceForm.kind)) throw new Error('Choose a source type.');
        const input = {
          title: get('title'),
          ...sourceForm,
          kind: sourceForm.kind,
          eventAt:
            source && sourceForm.eventAt === localTime(source.eventAt)
              ? source.eventAt
              : sourceForm.eventAt
                ? toTimestamp(sourceForm.eventAt)
                : (source?.eventAt ?? new Date().toISOString()),
          topicIds: source?.topicIds ?? [],
        };
        const duplicate = current.sources.find(
          (s) =>
            s.id !== editor.id &&
            ((input.identifier &&
              s.identifier.toLowerCase() === input.identifier.toLowerCase() &&
              s.platform.toLowerCase() === input.platform.toLowerCase()) ||
              (input.url && s.url === input.url)),
        );
        if (duplicate) throw new Error('A source with this identifier or link already exists.');
        if (!editor.id) throw new Error('Create sources from a task.');
        return actions.updateSource(current, editor.id, input);
      }
      const input = {
        text: get('text'),
        kind: get('kind') as ActivityKind,
        eventAt: toTimestamp(get('eventAt')),
        topicIds: many('topicIds'),
        taskIds: many('taskIds'),
        sourceIds: activity?.sourceIds ?? [],
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
        {
          <>
            {editor.kind !== 'activity' && (
              <Field label="Title">
                <Input
                  name="title"
                  required
                  maxLength={500}
                  autoFocus
                  defaultValue={(item as Topic | Source | undefined)?.title}
                />
              </Field>
            )}
            {editor.kind === 'topic' && (
              <>
                <Field label="Status">
                  <Select
                    name="status"
                    defaultValue={
                      statuses.find((status) => status === topic?.status) ??
                      (topic?.status === 'canceled' ? 'completed' : 'in_progress')
                    }
                    options={selectOptions(statuses)}
                  />
                </Field>

                <ResponsiblePicker
                  names={[...new Set([...responsibleDirectory(w), ...createdNames])]}
                  selected={responsibles}
                  onChange={setResponsibles}
                  onCreate={(name) => setCreatedNames((names) => [...names, name])}
                  disabled={busy}
                />
              </>
            )}
            {editor.kind === 'topic' && (
              <>
                <div className="mb-4 flex items-end gap-2">
                  <input type="hidden" name="category" value={category} />
                  <div className="min-w-0 flex-1 [&_>_div]:mb-0">
                    <MultiSelect
                      label="Category"
                      options={[
                        ...new Set([
                          ...w.topics.map((t) => t.category),
                          ...Object.keys(w.categoryColors ?? {}),
                          ...Object.keys(categoryColors),
                          category,
                        ]),
                      ].filter(Boolean)}
                      value={category ? [category] : []}
                      onValueChange={(values) => setCategory(values[0] ?? category)}
                      onCreate={setCategory}
                      multiple={false}
                      disabled={busy}
                    />
                  </div>
                  <Input
                    type="color"
                    value={categoryColor}
                    aria-label="Category color"
                    title="Category color — shared by all topics in this category"
                    disabled={busy}
                    className="h-9 w-9 shrink-0 cursor-pointer overflow-hidden [&[type=color]]:p-0 [&[type=color]]:border-0 [&::-webkit-color-swatch-wrapper]:[padding:0px] [&::-webkit-color-swatch]:[border:0px] [&::-moz-color-swatch]:[border-style:none]"
                    onChange={(event) =>
                      setCategoryColors((colors) => ({
                        ...colors,
                        [category.trim()]: event.target.value,
                      }))
                    }
                  />
                </div>
                <details className="mb-4 text-xs rounded-lg [border:1px_solid_var(--border)] p-4">
                  <summary className="cursor-pointer font-medium">Advanced fields</summary>
                  <div className="pt-4">
                    {!elevatedPriority && targetDateField}
                    <Field label="Summary">
                      <Textarea name="summary" rows={4} defaultValue={topic?.summary} />
                    </Field>
                    <Field label="Priority">
                      <Select
                        name="priority"
                        value={priority}
                        onValueChange={(value) => {
                          const selected = priorities.find((option) => option === value);
                          if (selected) setPriority(selected);
                        }}
                        options={selectOptions(priorities)}
                      />
                    </Field>
                  </div>
                </details>
                {elevatedPriority && targetDateField}
              </>
            )}
            {editor.kind === 'activity' && (
              <div className="form-grid grid [grid-template-columns:1fr_1fr] [gap:16px] [@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]">
                <Field label="Type">
                  <Select
                    name="kind"
                    defaultValue={activity?.kind ?? 'note'}
                    options={[...selectOptions(activityKinds)]}
                  />
                </Field>
                <Field label="Event date and time (local)">
                  <DateInput
                    withTime
                    name="eventAt"
                    required
                    defaultValue={localTime(activity?.eventAt)}
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
              <SourceFields
                value={sourceForm}
                onChange={(patch) => setSourceForm((current) => ({ ...current, ...patch }))}
                sources={w.sources}
                disabled={busy}
              />
            )}
          </>
        }
        {editor.kind === 'activity' && (
          <Checks
            title="Linked topics"
            name="topicIds"
            options={w.topics}
            selected={activity?.topicIds ?? (editor.topicId ? [editor.topicId] : [])}
          />
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
          <Button
            tone="primary"
            type="submit"
            disabled={busy || (editor.kind === 'source' && !sourceForm.kind)}
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
