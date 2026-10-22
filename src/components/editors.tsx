'use client';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useId, useState, type FormEvent } from 'react';
import * as actions from '../application/workspace';
import { SourceFields } from './source-fields';
import {
  initialSourcePlatform,
  isSourceType,
  sourceType,
  clearSourcePlatforms,
  type SourceFormValues,
  type SourcePlatform,
} from '../domain/sources';
import { TaskEditor } from './task-editor';
import { ResponsiblePicker, useResponsibleDraft } from './responsible-picker';
import { responsibleDirectory } from '../domain/responsibles';
import { toTimestamp } from '../domain/dates';
import type { Priority, Status, Workspace } from '../domain/model';
import { Button, Confirm, DateInput, Field, Input, Modal, MultiSelect, Select, Textarea } from './core';
import { selectOptions, priorities, statuses } from '../domain/options';
export type Editor = {
  kind: 'topic' | 'task' | 'source';
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
  const formId = useId();
  const topic = w.topics.find((x) => x.id === editor.id);
  const source = w.sources.find((x) => x.id === editor.id);
  const item = editor.kind === 'topic' ? topic : source;
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
  const [removedPlatforms, setRemovedPlatforms] = useState<SourcePlatform[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [removedCategories, setRemovedCategories] = useState<string[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const categoryUsage = w.topics.filter((topic) => topic.category === categoryToDelete).length;
  const categoryColor =
    categoryColors[category.trim()] ??
    (removedCategories.includes(category.trim()) ? undefined : w.categoryColors?.[category.trim()]) ??
    '#64748b';
  function removeCategory(name: string) {
    setRemovedCategories((names) => [...new Set([...names, name])]);
    setCategoryColors((colors) => Object.fromEntries(Object.entries(colors).filter(([key]) => key !== name)));
    if (category === name) setCategory('');
    setCategoryToDelete(null);
  }
  const assignees = useResponsibleDraft(w, topic);
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
    const nullable = (name: string) => get(name) || null;
    const common = {
      title: get('title'),
      status: get('status') as Status,
      priority: get('priority') as Priority,
      responsibleNames: assignees.selected,
    };
    const transform = (current: Workspace): Workspace => {
      if (editor.kind === 'topic') {
        current = actions.deleteCategories(current, removedCategories);
        current = actions.deleteResponsibles(current, assignees.removed);
        current = {
          ...current,
          responsibleNames: [...new Set([...responsibleDirectory(current), ...assignees.created])],
          categoryColors: {
            ...current.categoryColors,
            ...(get('category') ? { [get('category')]: categoryColor } : {}),
          },
        };
        const input = {
          ...common,
          requesterName: assignees.requester,
          summary: get('summary'),
          category: get('category'),
          startDate: nullable('startDate'),
          targetDate: nullable('targetDate'),
        };
        return editor.id
          ? actions.updateTopic(current, editor.id, input)
          : actions.createTopic(current, input);
      }
      if (editor.kind === 'source') {
        current = actions.deleteSourcePlatforms(current, removedPlatforms);
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
      throw new Error('Unsupported editor.');
    };
    if (await onSave(transform)) onClose();
  }
  return (
    <Modal
      title={`${editor.id ? 'Edit' : 'New'} ${editor.kind}`}
      onClose={onClose}
      wide
      footer={
        <>
          {item && editor.id && (
            <Button type="button" tone="danger" className="mr-auto" disabled={busy} onClick={() => onDelete(editor.kind, item.id)}>
              <IconTrash size={16} /> Delete {editor.kind}
            </Button>
          )}
          <Button type="button" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button tone="primary" type="submit" form={formId} disabled={busy || (editor.kind === 'source' && !sourceForm.kind)}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit}>
        {error && (
          <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mb-5">
            {error}
          </p>
        )}
        {
          <>
            <Field label="Title">
              <Input
                name="title"
                required
                maxLength={500}
                autoFocus
                defaultValue={item?.title}
              />
            </Field>
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
                  workspace={w}
                  names={assignees.names}
                  selected={assignees.selected}
                  onChange={assignees.onChange}
                  onCreate={assignees.onCreate}
                  onDelete={assignees.onDelete}
                  disabled={busy}
                />
                <ResponsiblePicker
                  label="Requester"
                  multiple={false}
                  workspace={w}
                  names={assignees.names}
                  selected={assignees.requester ? [assignees.requester] : []}
                  onChange={(names) => assignees.onRequesterChange(names[0] ?? '')}
                  onCreate={assignees.onCreate}
                  onDelete={assignees.onDelete}
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
                          ...[
                            ...w.topics.map((t) => t.category),
                            ...Object.keys(w.categoryColors ?? {}),
                          ].filter((name) => !removedCategories.includes(name)),
                          ...Object.keys(categoryColors),
                          category,
                        ]),
                      ].filter(Boolean)}
                      value={category ? [category] : []}
                      onValueChange={(values) => setCategory(values[0] ?? '')}
                      onCreate={setCategory}
                      onDelete={(name) => {
                        if (w.topics.some((topic) => topic.category === name)) setCategoryToDelete(name);
                        else removeCategory(name);
                      }}
                      multiple={false}
                      disabled={busy}
                    />
                  </div>
                  <Input
                    type="color"
                    value={categoryColor}
                    aria-label="Category color"
                    title="Category color — shared by all topics in this category"
                    disabled={busy || !category}
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
                    <Field label="Start date">
                      <DateInput name="startDate" defaultValue={topic?.startDate ?? dayjs(topic?.createdAt).format('YYYY-MM-DD')} />
                    </Field>
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
            {editor.kind === 'source' && (
              <SourceFields
                value={sourceForm}
                onChange={(patch) => setSourceForm((current) => ({ ...current, ...patch }))}
                sources={clearSourcePlatforms(w.sources, removedPlatforms)}
                onDeletePlatform={(platform) => setRemovedPlatforms((items) => [...items, platform])}
                disabled={busy}
              />
            )}
          </>
        }
      </form>
      {categoryToDelete !== null && (
        <Confirm
          title={`Delete category “${categoryToDelete}”?`}
          description={`This will remove the category from ${categoryUsage} topic(s), including archived topics, and delete its saved color. Topics and their contents will be preserved. Changes apply when you save this form.`}
          confirmLabel="Delete category"
          busy={busy}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={() => removeCategory(categoryToDelete)}
        />
      )}
    </Modal>
  );
}
