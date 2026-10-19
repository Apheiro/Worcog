'use client';
import { IconLink, IconPaperclip, IconPlus, IconRepeat, IconTrash } from '@tabler/icons-react';
import { cva } from 'cva';
import { formatDate, isOverdue } from '../domain/dates';
import type { Status, Task, Workspace } from '../domain/model';
import { assignedNames } from '../domain/responsibles';
import { Checkbox } from './core/checkbox';
import { Button, Select } from './core';
import { selectOptions, human, statuses } from '../domain/options';

const taskRow = cva({
  base: [
    'task-row',
    'p-4 flex items-start gap-3 [border-bottom:1px_solid_var(--border)]',
    '[&:hover]:[background:var(--surface-soft)] [&:focus-within]:[background:var(--surface-soft)]',
    '[&:last-child]:border-0',
    '[&_.compact-select]:[font-size:11px] [&_.compact-select]:[padding:4px_7px] [&_.compact-select]:[width:110px] [&_.compact-select]:shrink-0',
    'flex-wrap [&_>_.flex-1]:[min-width:min(220px,_100%_-_40px)]',
  ],
  variants: {
    child: { true: ['task-child', 'pl-8'], false: '' },
    completed: { true: ['task-completed', '[background:var(--surface-soft)]'], false: '' },
  },
});

export type TaskRowProps = {
  task: Task;
  workspace: Workspace;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
  onAddSubtask: (task: Task) => void;
  onDelete: (id: string) => void;
  onOpenSource: (id: string) => void;
  onOpenFile: (id: string) => void;
  showContext?: boolean;
  busy: boolean;
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
}: TaskRowProps) {
  const parent = w.tasks.find((t) => t.id === task.parentId);
  const sources = w.sources.filter((source) => task.sourceIds.includes(source.id));
  const files = w.attachments.filter((file) => file.taskIds.includes(task.id));
  return (
    <div
      className={taskRow({
        child: !!parent,
        completed: task.status === 'completed',
      })}
      role="group"
      aria-label={task.title}
      aria-busy={busy}
    >
      <Checkbox
        appearance="task"
        aria-label={`Mark ${task.title} ${task.status === 'completed' ? 'pending' : 'completed'}`}
        checked={task.status === 'completed'}
        disabled={busy}
        onCheckedChange={(checked) => onStatus(task.id, checked === true ? 'completed' : 'pending')}
      />
      <div className="min-w-0 flex-1 flex flex-col items-start gap-2">
        <Button
          tone="link"
          size="auto"
          className={`${task.status === 'completed' ? 'completed [text-decoration:line-through] [color:var(--muted)]' : ''}`}
          onClick={() => onEdit(task.id)}
        >
          {task.title}
        </Button>
        {!showContext && assignedNames(task).length > 0 && (
          <p className="text-xs [color:var(--muted)] m-0">{assignedNames(task).join(', ')}</p>
        )}
        {showContext && (
          <div className="row-subtitle block m-0 [font-size:11px] [color:var(--muted)] [line-height:1.5] [overflow-wrap:anywhere]">
            {w.topics.find((t) => t.id === task.topicId)?.title}
            {parent && ` / ${parent.title}`} · {assignedNames(task).join(', ') || 'Unassigned'} ·{' '}
            {human(task.priority)}
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
                  <span>{file.originalName}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="task-actions flex items-center flex-wrap gap-2 ml-auto">
        {task.dueDate && (
          <span
            className={
              isOverdue(task)
                ? 'overdue [color:var(--danger-ink)] [font-weight:550] text-sm'
                : 'muted [color:var(--muted)] text-sm'
            }
          >
            {isOverdue(task) && 'Overdue · '}
            {formatDate(task.dueDate)}
          </span>
        )}
        <Select
          className="compact-select"
          aria-label={`Status of ${task.title}`}
          value={task.status}
          disabled={busy}
          onValueChange={(e) => onStatus(task.id, e as Status)}
          options={selectOptions(statuses)}
        />
        <Button
          size="sm"
          tone="ghost"
          className="task-action"
          disabled={busy}
          aria-label={`Add subtask to ${task.title}`}
          onClick={() => onAddSubtask(task)}
        >
          <IconPlus size={16} />
        </Button>
        <Button
          size="sm"
          tone="ghost"
          className="task-action"
          disabled={busy}
          aria-label={`Delete task ${task.title}`}
          onClick={() => onDelete(task.id)}
        >
          <IconTrash size={16} />
        </Button>
      </div>
    </div>
  );
}
