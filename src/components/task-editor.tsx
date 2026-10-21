'use client';
import { useRef, useState, type FormEvent } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { saveTaskWithResources, type TaskResourcesDraft } from '../application/task-resources';
import type { Priority, Task } from '../domain/model';
import { assignedNames, responsibleDirectory } from '../domain/responsibles';
import { priorities, selectOptions } from '../domain/options';
import { errorMessage, native } from '../infrastructure/native';
import type { EntityEditorProps } from './editors';
import { Button, DateInput, Field, Input, Modal, Select, Textarea } from './core';
import { today } from '../domain/dates';
import { ResponsiblePicker } from './responsible-picker';
import { TaskResources } from './task-resources';

export function TaskEditor({
  editor,
  workspace: w,
  busy,
  error,
  openFile,
  onClose,
  onDelete,
  onSave,
}: EntityEditorProps) {
  const task = w.tasks.find((item) => item.id === editor.id);
  const parent = w.tasks.find((item) => item.id === editor.parentId);
  const topicId = task?.topicId ?? parent?.topicId ?? editor.topicId ?? '';
  const parentId = task?.parentId ?? parent?.id ?? null;
  const [resources, setResources] = useState<TaskResourcesDraft>(() => ({
    sourceIds: task?.sourceIds ?? [],
    fileIds: w.attachments
      .filter((file) => file.taskIds.includes(task?.id ?? ''))
      .map((file) => file.id),
    sources: [],
    files: [],
  }));
  const [responsibles, setResponsibles] = useState(task ? assignedNames(task) : []);
  const [createdNames, setCreatedNames] = useState<string[]>([]);
  const [resourceBusy, setResourceBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState('');
  const locked = useRef(false);
  const disabled = busy || resourceBusy || working;
  const directory = [...new Set([...responsibleDirectory(w), ...createdNames])];
  async function close() {
    if (disabled || locked.current) return;
    locked.current = true;
    setWorking(true);
    setLocalError('');
    try {
      for (const file of resources.files) await native.discardDraft(file.managedName);
      onClose();
    } catch (cause) {
      setLocalError(errorMessage(cause));
    } finally {
      locked.current = false;
      setWorking(false);
    }
  }
  async function requestDelete() {
    if (!task || disabled || locked.current) return;
    locked.current = true;
    setWorking(true);
    setLocalError('');
    try {
      for (const file of resources.files) await native.discardDraft(file.managedName);
      const pending = new Set(resources.files.map((file) => file.id));
      setResources({
        ...resources,
        files: [],
        fileIds: resources.fileIds.filter((id) => !pending.has(id)),
      });
      onDelete('task', task.id);
    } catch (cause) {
      setLocalError(errorMessage(cause));
    } finally {
      locked.current = false;
      setWorking(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || locked.current) return;
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? '').trim();
    const input = {
      title: get('title'),
      topicId,
      parentId,
      status: task?.status ?? 'in_progress',
      priority: get('priority') as Priority,
      responsibleNames: responsibles,
      description: get('description'),
      startDate: get('startDate') || null,
      dueDate: get('dueDate') || null,
      recurrence: get('recurrence') as Task['recurrence'],
    };
    locked.current = true;
    setWorking(true);
    setLocalError('');
    try {
      const saved = await onSave((current) =>
        saveTaskWithResources(current, editor.id, input, resources, createdNames),
      );
      if (saved) onClose();
    } catch (cause) {
      setLocalError(errorMessage(cause));
    } finally {
      locked.current = false;
      setWorking(false);
    }
  }
  return (
    <Modal
      title={task ? 'Edit task' : parent ? 'New subtask' : 'New task'}
      onClose={() => void close()}
      wide
    >
      <p className="text-xs [color:var(--muted)] mb-4">
        {w.topics.find((topic) => topic.id === topicId)?.title ?? 'Create this task from a topic.'}
        {parent && ` / ${parent.title}`}
      </p>
      <form onSubmit={submit}>
        {(localError || error) && (
          <p role="alert" className="text-xs [color:var(--danger-ink)] mb-4">
            {localError || error}
          </p>
        )}
        <fieldset disabled={disabled} className="border-0 m-0 p-0 min-w-0">
          <Field label="Title">
            <Input name="title" autoFocus required maxLength={500} defaultValue={task?.title} />
          </Field>
          <Field label="Priority">
            <Select
              name="priority"
              defaultValue={task?.priority ?? 'normal'}
              options={selectOptions(priorities)}
            />
          </Field>
          <Field label="Deadline">
            <DateInput name="dueDate" defaultValue={task?.dueDate ?? ''} />
          </Field>
          <ResponsiblePicker
            disabled={disabled}
            names={directory}
            selected={responsibles}
            onChange={setResponsibles}
            onCreate={(name) => setCreatedNames((names) => [...names, name])}
          />
          <TaskResources
            workspace={w}
            value={resources}
            onChange={setResources}
            onBusyChange={setResourceBusy}
            disabled={disabled}
            openFile={openFile}
          />
          <details className="text-xs mt-4 rounded-lg border border-solid [border-color:var(--border)] p-4">
            <summary className="cursor-pointer font-medium">Advanced fields</summary>
            <div className="pt-4">
              <Field label="Description">
                <Textarea name="description" rows={3} defaultValue={task?.description} />
              </Field>
              <Field label="Start date">
                <DateInput
                  name="startDate"
                  defaultValue={task ? (task.startDate ?? '') : today()}
                />
              </Field>
              <Field label="Repeat">
                <Select
                  name="recurrence"
                  defaultValue={task?.recurrence ?? 'none'}
                  options={selectOptions(['none', 'daily', 'weekly', 'monthly'])}
                />
              </Field>
              <p className="[color:var(--muted)]">
                Repeating tasks require a deadline. Each occurrence is a separate task.
              </p>
            </div>
          </details>
        </fieldset>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-0 border-t border-solid [border-color:var(--border)]">
          {task && (
            <Button
              type="button"
              tone="danger"
              className="mr-auto"
              disabled={disabled}
              onClick={() => void requestDelete()}
            >
              <IconTrash size={15} /> Delete task
            </Button>
          )}
          <Button type="button" disabled={disabled} onClick={() => void close()}>
            Cancel
          </Button>
          <Button type="submit" tone="primary" disabled={disabled || !topicId}>
            {disabled ? 'Working…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
