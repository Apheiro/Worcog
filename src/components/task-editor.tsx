'use client';
import { useId, useRef, useState, type FormEvent } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { saveTaskWithResources, type TaskResourcesDraft } from '../application/task-resources';
import type { Priority, Task } from '../domain/model';
import { deleteResponsibles } from '../application/workspace';
import { taskPriorities, taskPriority, selectOptions } from '../domain/options';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import type { EntityEditorProps } from './editors';
import { Button, DateInput, Field, Input, Modal, Select, Switch, Textarea } from './core';
import { today, toTimestamp } from '../domain/dates';
import dayjs from 'dayjs';
import { useWorcog } from '../providers/worcog';
import { ResponsiblePicker, useResponsibleDraft } from './responsible-picker';
import { TaskResources, type TaskResourcesHandle } from './task-resources';

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
  const { reminders } = useWorcog();
  const initialReminder = task?.reminderAt ? dayjs(task.reminderAt).format('YYYY-MM-DDTHH:mm') : '';
  const [reminderEnabled, setReminderEnabled] = useState(!!task?.reminderAt);
  const [reminderDate, setReminderDate] = useState(initialReminder);
  const reminderUnavailable = !reminders.enabled;
  const finished = task?.status === 'completed' || task?.status === 'canceled';
  const formId = useId();
  const resourcesEditor = useRef<TaskResourcesHandle>(null);
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
  const assignees = useResponsibleDraft(w, task);
  const [resourceBusy, setResourceBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState('');
  const locked = useRef(false);
  const disabled = busy || resourceBusy || working;
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
    if (resourcesEditor.current?.prepareSave() === false) {
      notifications.warning('Add the pending resource to the task, or discard its draft, before saving.');
      return;
    }
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? '').trim();
    let reminderAt = reminderEnabled ? (reminderDate === initialReminder && task?.reminderAt ? task.reminderAt : '') : null;
    if (reminderEnabled && !reminderAt) {
      if (reminderUnavailable) {
        setLocalError('Cannot enable a reminder. Enable both Tray icon and Reminder notifications in Settings → General first.');
        notifications.warning('Enable Tray icon and Reminder notifications in Settings → General before scheduling a reminder.');
        return;
      }
      if (!reminderDate || !dayjs(reminderDate).isValid() || !dayjs(reminderDate).isAfter(dayjs())) {
        setLocalError('Choose a future date and time for the reminder.'); return;
      }
      if (finished) { setLocalError('Reopen this task before scheduling a reminder.'); return; }
      reminderAt = toTimestamp(reminderDate);
    }
    const input = {
      title: get('title'),
      topicId,
      parentId,
      status: task?.status ?? 'in_progress',
      priority: get('priority') as Priority,
      responsibleNames: assignees.selected,
      description: get('description'),
      startDate: get('startDate') || null,
      dueDate: get('dueDate') || null,
      reminderAt,
      recurrence: get('recurrence') as Task['recurrence'],
    };
    locked.current = true;
    setWorking(true);
    setLocalError('');
    try {
      const saved = await onSave((current) =>
        saveTaskWithResources(deleteResponsibles(current, assignees.removed), editor.id, input, resources, assignees.created),
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
      footer={
        <>
          {task && (
            <Button type="button" tone="danger" className="mr-auto" disabled={disabled} onClick={() => void requestDelete()}>
              <IconTrash size={15} /> Delete task
            </Button>
          )}
          <Button type="button" disabled={disabled} onClick={() => void close()}>Cancel</Button>
          <Button type="submit" form={formId} tone="primary" disabled={disabled || !topicId}>
            {disabled ? 'Working…' : 'Save'}
          </Button>
        </>
      }
    >
      <p className="text-xs [color:var(--muted)] mb-4">
        {w.topics.find((topic) => topic.id === topicId)?.title ?? 'Create this task from a topic.'}
        {parent && ` / ${parent.title}`}
      </p>
      <form id={formId} onSubmit={submit}>
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
              defaultValue={taskPriority(task?.priority ?? 'normal')}
              options={selectOptions(taskPriorities)}
            />
          </Field>
          <Field label="Deadline">
            <DateInput name="dueDate" defaultValue={task?.dueDate ?? ''} />
          </Field>
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span id={`${formId}-reminder-label`} className="text-xs font-medium [color:var(--secondary)]">Reminder</span>
              <Switch disabled={disabled} aria-labelledby={`${formId}-reminder-label`} aria-describedby={`${formId}-reminder-help`} checked={reminderEnabled} onCheckedChange={(checked) => {
                if (checked && (reminderUnavailable || finished)) {
                  const message = finished ? 'Reopen this task before scheduling a reminder.' : 'Cannot enable a reminder. Enable both Tray icon and Reminder notifications in Settings → General first.';
                  setLocalError(message); notifications.warning(message); return;
                }
                setReminderEnabled(checked);
              }} />
            </div>
            <p id={`${formId}-reminder-help`} className="text-xs [color:var(--muted)]">
              {reminderUnavailable ? 'Reminders are paused. Enable Tray icon and Reminder notifications in Settings → General to schedule one.' : 'An independent date and time. The alert keeps sounding until you dismiss it.'}
            </p>
            {reminderEnabled && <Field label="Reminder date and time">
              <DateInput withTime value={reminderDate} onValueChange={setReminderDate} disabled={disabled || reminderUnavailable || finished} />
            </Field>}
            {reminderEnabled && task?.reminderDismissedAt && reminderDate === initialReminder && <p className="text-xs [color:var(--muted)]">This reminder was dismissed. Choose a new future date to schedule it again.</p>}
          </div>
          <ResponsiblePicker
            disabled={disabled}
            workspace={w}
            names={assignees.names}
            selected={assignees.selected}
            onChange={assignees.onChange}
            onCreate={assignees.onCreate}
            onDelete={assignees.onDelete}
          />
          <TaskResources
            ref={resourcesEditor}
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
      </form>
    </Modal>
  );
}
