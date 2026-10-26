'use client';
import { useLabels } from '../i18n/use-labels';
import { useTranslations } from 'next-intl';
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
  const localize = useLabels();
  const tr = useTranslations('ui');
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
      notifications.warning(
        tr('add_the_pending_resource_to_the_task_or_discard_its_draft_before_saving'),
      );
      return;
    }
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? '').trim();
    let reminderAt = reminderEnabled
      ? reminderDate === initialReminder && task?.reminderAt
        ? task.reminderAt
        : ''
      : null;
    if (reminderEnabled && !reminderAt) {
      if (reminderUnavailable) {
        setLocalError(
          tr(
            'cannot_enable_a_reminder_enable_both_tray_icon_and_reminder_notifications_in_settings_general_first',
          ),
        );
        notifications.warning(
          tr(
            'enable_tray_icon_and_reminder_notifications_in_settings_general_before_scheduling_a_reminder',
          ),
        );
        return;
      }
      if (
        !reminderDate ||
        !dayjs(reminderDate).isValid() ||
        !dayjs(reminderDate).isAfter(dayjs())
      ) {
        setLocalError(tr('choose_a_future_date_and_time_for_the_reminder'));
        return;
      }
      if (finished) {
        setLocalError(tr('reopen_this_task_before_scheduling_a_reminder'));
        return;
      }
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
        saveTaskWithResources(
          deleteResponsibles(current, assignees.removed),
          editor.id,
          input,
          resources,
          assignees.created,
        ),
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
      title={task ? tr('edit_task') : parent ? tr('new_subtask') : tr('new_task')}
      onClose={() => void close()}
      wide
      footer={
        <>
          {task && (
            <Button
              type="button"
              tone="danger"
              className="mr-auto"
              disabled={disabled}
              onClick={() => void requestDelete()}
            >
              <IconTrash size={15} /> {tr('delete_task')}{' '}
            </Button>
          )}
          <Button type="button" disabled={disabled} onClick={() => void close()}>
            {' '}
            {tr('cancel')}{' '}
          </Button>
          <Button type="submit" form={formId} tone="primary" disabled={disabled || !topicId}>
            {disabled ? tr('working') : tr('save')}
          </Button>
        </>
      }
    >
      <p className="text-xs [color:var(--muted)] mb-4">
        {w.topics.find((topic) => topic.id === topicId)?.title ??
          tr('create_this_task_from_a_topic')}
        {parent && ` / ${parent.title}`}
      </p>
      <form id={formId} onSubmit={submit}>
        {(localError || error) && (
          <p role="alert" className="text-xs [color:var(--danger-ink)] mb-4">
            {localError || error}
          </p>
        )}
        <fieldset disabled={disabled} className="border-0 m-0 p-0 min-w-0">
          <Field label={tr('title')}>
            <Input name="title" autoFocus required maxLength={500} defaultValue={task?.title} />
          </Field>
          <Field label={tr('priority')}>
            <Select
              name="priority"
              defaultValue={taskPriority(task?.priority ?? 'normal')}
              options={selectOptions(taskPriorities).map((option) => ({
                ...option,
                label: localize(option.label),
              }))}
            />
          </Field>
          <Field label={tr('deadline')}>
            <DateInput name="dueDate" defaultValue={task?.dueDate ?? ''} />
          </Field>
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span
                id={`${formId}-reminder-label`}
                className="text-xs font-medium [color:var(--secondary)]"
              >
                {' '}
                {tr('reminder')}{' '}
              </span>
              <Switch
                disabled={disabled}
                aria-labelledby={`${formId}-reminder-label`}
                aria-describedby={`${formId}-reminder-help`}
                checked={reminderEnabled}
                onCheckedChange={(checked) => {
                  if (checked && (reminderUnavailable || finished)) {
                    const message = finished
                      ? 'Reopen this task before scheduling a reminder.'
                      : 'Cannot enable a reminder. Enable both Tray icon and Reminder notifications in Settings → General first.';
                    setLocalError(message);
                    notifications.warning(message);
                    return;
                  }
                  setReminderEnabled(checked);
                }}
              />
            </div>
            <p id={`${formId}-reminder-help`} className="text-xs [color:var(--muted)]">
              {reminderUnavailable
                ? tr(
                    'reminders_are_paused_enable_tray_icon_and_reminder_notifications_in_settings_general_to_schedule_one',
                  )
                : tr('an_independent_date_and_time_the_alert_keeps_sounding_until_you_dismiss_it')}
            </p>
            {reminderEnabled && (
              <Field label={tr('reminder_date_and_time')}>
                <DateInput
                  withTime
                  value={reminderDate}
                  onValueChange={setReminderDate}
                  disabled={disabled || reminderUnavailable || finished}
                />
              </Field>
            )}
            {reminderEnabled && task?.reminderDismissedAt && reminderDate === initialReminder && (
              <p className="text-xs [color:var(--muted)]">
                {' '}
                {tr(
                  'this_reminder_was_dismissed_choose_a_new_future_date_to_schedule_it_again',
                )}{' '}
              </p>
            )}
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
            <summary className="cursor-pointer font-medium"> {tr('advanced_fields')} </summary>
            <div className="pt-4">
              <Field label={tr('description')}>
                <Textarea name="description" rows={3} defaultValue={task?.description} />
              </Field>
              <Field label={tr('start_date')}>
                <DateInput
                  name="startDate"
                  defaultValue={task ? (task.startDate ?? '') : today()}
                />
              </Field>
              <Field label={tr('repeat')}>
                <Select
                  name="recurrence"
                  defaultValue={task?.recurrence ?? 'none'}
                  options={selectOptions(['none', 'daily', 'weekly', 'monthly']).map((option) => ({
                    ...option,
                    label: localize(option.label),
                  }))}
                />
              </Field>
              <p className="[color:var(--muted)]">
                {tr('repeating_tasks_require_a_deadline_each_occurrence_is_a_separate_task')}{' '}
              </p>
            </div>
          </details>
        </fieldset>
      </form>
    </Modal>
  );
}
