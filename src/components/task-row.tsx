'use client';
import {
  IconChevronDown,
  IconChevronRight,
  IconLink,
  IconPaperclip,
  IconPlus,
  IconRepeat,
  IconTrash,
  IconAlertTriangle,
  IconLock,
  IconLockOpen,
  IconNotes,
  IconTimeline,
} from '@tabler/icons-react';
import { useId, useState, type FormEvent } from 'react';
import { cva } from 'cva';
import { formatDate, isOverdue } from '../domain/dates';
import type { Status, Task, Workspace } from '../domain/model';
import { assignedNames } from '../domain/responsibles';
import { Checkbox } from './core/checkbox';
import { ActionMenu, Button, Card, Field, Modal, Textarea, Tooltip } from './core';
import { deadlineIndicator } from '../application/topic-inactivity';
import { human, taskPriority } from '../domain/options';
import { useWorklog } from '../providers/worklog';
import { AttachmentStatus } from './attachment-status';
import { TaskProgress, TaskUpdateForm } from './task-progress';

const taskRow = cva({
  base: [
    'task-row',
    'p-2 flex items-start gap-3',
    '[&:hover]:[background:var(--surface-soft)] [&:focus-within]:[background:var(--surface-soft)]',
    'flex-wrap [&_>_.flex-1]:[min-width:min(220px,_100%_-_40px)]',
  ],
  variants: {
    completed: { true: ['task-completed', '[background:var(--surface-soft)]'], false: '' },
  },
});

export type TaskRowProps = {
  task: Task;
  workspace: Workspace;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status, blockReason?: string) => void | Promise<boolean>;
  onAddSubtask: (task: Task) => void;
  onDelete: (id: string) => void;
  onOpenSource: (id: string) => void;
  onOpenFile: (id: string) => void;
  showContext?: boolean;
  busy: boolean;
  childrenExpanded?: boolean;
  onToggleChildren?: () => void;
};

export function TaskRow({
  task,
  workspace: w,
  onEdit,
  onStatus,
  busy,
  onAddSubtask,
  onDelete,
  onOpenSource,
  onOpenFile,
  showContext = true,
  childrenExpanded,
  onToggleChildren,
}: TaskRowProps) {
  const { inactivitySettings } = useWorklog();
  const parent = w.tasks.find((t) => t.id === task.parentId);
  const sources = w.sources.filter((source) => task.sourceIds.includes(source.id));
  const files = w.attachments.filter((file) => file.taskIds.includes(task.id));
  const deadline = deadlineIndicator(task.createdAt, task.dueDate, inactivitySettings);
  const [blocking, setBlocking] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [updatesExpanded, setUpdatesExpanded] = useState(false);
  const updatesRegionId = useId();
  const updates = w.activities.filter((activity) => activity.kind === 'progress' && activity.taskIds.includes(task.id));
  const [reason, setReason] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  const blocked = task.status === 'blocked';
  async function block(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim() || busy || savingBlock) return;
    setSavingBlock(true);
    try {
      const saved = await onStatus(task.id, 'blocked', reason.trim());
      if (saved !== false) {
        setBlocking(false);
        setReason('');
      }
    } finally {
      setSavingBlock(false);
    }
  }
  return (
    <>
      <Card
        className={taskRow({
          completed: task.status === 'completed',
        })}
        role="group"
        aria-label={task.title}
        aria-busy={busy}
      >
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Checkbox
            appearance="task"
            aria-label={`Mark ${task.title} ${task.status === 'completed' ? 'in progress' : 'completed'}`}
            checked={task.status === 'completed'}
            disabled={busy}
            onCheckedChange={(checked) =>
              void onStatus(task.id, checked === true ? 'completed' : 'in_progress')
            }
          />
          {deadline && (
            <span
              role="img"
              title={deadline.label}
              aria-label={deadline.label}
              className="h-1 w-[18px] rounded-full"
              style={{ backgroundColor: deadline.color }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col items-start gap-2">
          <div className="flex w-full min-w-0 items-start gap-2">
            {onToggleChildren && (
              <Button
                type="button"
                size="auto"
                tone="ghost"
                className="h-5 w-5 shrink-0 p-0"
                aria-expanded={childrenExpanded}
                aria-label={`${childrenExpanded ? 'Collapse' : 'Expand'} subtasks of ${task.title}`}
                onClick={onToggleChildren}
              >
                {childrenExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </Button>
            )}
            <Button
              tone="link"
              size="auto"
              className={`${task.status === 'completed' ? 'completed [text-decoration:line-through] [color:var(--muted)]' : ''}`}
              onClick={() => onEdit(task.id)}
            >
              {task.title}
            </Button>
          </div>
          {!showContext && assignedNames(task).length > 0 && (
            <p className="text-xs [color:var(--muted)] m-0">{assignedNames(task).join(', ')}</p>
          )}
          {showContext && (
            <div className="row-subtitle block m-0 [font-size:11px] [color:var(--muted)] [line-height:1.5] [overflow-wrap:anywhere]">
              {w.topics.find((t) => t.id === task.topicId)?.title}
              {parent && ` / ${parent.title}`} · {assignedNames(task).join(', ') || 'Unassigned'} ·{' '}
              {human(taskPriority(task.priority))}
              {task.recurrence !== 'none' && (
                <span className="inline-icon inline-flex [gap:4px] items-center">
                  <IconRepeat size={13} />
                  {human(task.recurrence)}
                </span>
              )}
              {task.recurrenceRootId && ' · Recurring instance'}
            </div>
          )}
          {(sources.length > 0 || files.length > 0) && (
            <ul
              className="task-resources flex flex-wrap gap-1.5 m-0 list-none p-0 [&_li]:min-w-0 [&_li]:max-w-full"
              aria-label={`Resources for ${task.title}`}
            >
              {sources.map((source) => (
                <li key={source.id}>
                  <Button
                    tone="chip"
                    size="auto"
                    type="button"
                    className="task-resource max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`View source ${source.title}${source.identifier ? ` · ${source.identifier}` : ''}`}
                    onClick={() => onOpenSource(source.id)}
                  >
                    <IconLink size={13} aria-hidden="true" />
                    <span>
                      {source.title}
                      {source.identifier && ` · ${source.identifier}`}
                    </span>
                  </Button>
                </li>
              ))}
              {files.map((file) => (
                <li key={file.id}>
                  <Button
                    tone="chip"
                    size="auto"
                    type="button"
                    className="task-resource max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Open file ${file.originalName}`}
                    disabled={busy}
                    onClick={() => onOpenFile(file.id)}
                  >
                    <IconPaperclip size={13} aria-hidden="true" />
                    <span>{file.originalName}<AttachmentStatus id={file.id} /></span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="task-actions ml-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {blocked && (
              <Tooltip content={task.blockReason || 'No reason recorded for this existing task.'}>
                <span
                  tabIndex={0}
                  role="img"
                  aria-label={`Blocked: ${task.blockReason || 'No reason recorded.'}`}
                  className="inline-flex shrink-0 [color:var(--blocked-ink)] rounded focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]"
                >
                  <IconAlertTriangle size={16} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
            {updates.length > 0 && (
              <Tooltip content={`${updatesExpanded ? 'Hide' : 'Show'} updates (${updates.length})`}>
                <Button
                  type="button"
                  tone="ghost"
                  size="auto"
                  className={`h-5 w-5 shrink-0 p-0 ${updatesExpanded ? '[color:var(--ink)]' : '[color:var(--muted)]'}`}
                  aria-label={`${updatesExpanded ? 'Collapse' : 'Expand'} updates for ${task.title}`}
                  aria-expanded={updatesExpanded}
                  aria-controls={updatesRegionId}
                  onClick={() => setUpdatesExpanded((value) => !value)}
                >
                  <IconTimeline size={16} aria-hidden="true" />
                </Button>
              </Tooltip>
            )}
            {task.description.trim() && (
              <Tooltip content={task.description}>
                <span tabIndex={0} role="img" aria-label="Task description" className="inline-flex shrink-0 [color:var(--muted)] rounded focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]">
                  <IconNotes size={16} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
            <ActionMenu
              label={`Actions for ${task.title}`}
              disabled={busy}
              items={[
                {
                  label: 'Add update',
                  icon: <IconNotes size={15} />,
                  opensDialog: true,
                  onSelect: () => setAddingUpdate(true),
                },
                {
                  label: 'Add subtask',
                  icon: <IconPlus size={15} />,
                  opensDialog: true,
                  onSelect: () => onAddSubtask(task),
                },
                {
                  label: 'Remove',
                  icon: <IconTrash size={15} />,
                  destructive: true,
                  opensDialog: true,
                  onSelect: () => onDelete(task.id),
                },
                {
                  label: blocked ? 'Unblocked' : 'Blocked',
                  icon: blocked ? <IconLockOpen size={15} /> : <IconLock size={15} />,
                  disabled: task.status === 'completed',
                  opensDialog: !blocked,
                  onSelect: () => {
                    if (blocked) void onStatus(task.id, 'in_progress');
                    else {
                      setReason('');
                      setBlocking(true);
                    }
                  },
                },
              ]}
            />
          </div>
          {task.dueDate && (
            <span className="text-xs [color:var(--muted)]">
              {isOverdue(task) && 'Overdue · '}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </Card>
      {updatesExpanded && <TaskProgress task={task} entries={updates} regionId={updatesRegionId} />}
      {addingUpdate && <TaskUpdateForm task={task} onClose={() => setAddingUpdate(false)} />}
      {blocking && (
        <Modal
          title="Block task"
          description={task.title}
          onClose={() => {
            if (!busy && !savingBlock) setBlocking(false);
          }}
        >
          <form onSubmit={(event) => void block(event)}>
            <Field label="Reason" hint="A reason is required to block this task.">
              <Textarea
                autoFocus
                required
                maxLength={10000}
                rows={3}
                value={reason}
                disabled={busy || savingBlock}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                disabled={busy || savingBlock}
                onClick={() => setBlocking(false)}
              >
                Cancel
              </Button>
              <Button type="submit" tone="primary" disabled={busy || savingBlock || !reason.trim()}>
                Block task
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
