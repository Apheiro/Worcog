'use client';
import { IconLink, IconPaperclip, IconPlus, IconRepeat, IconTrash } from '@tabler/icons-react';
import { cva } from 'cva';
import { formatDate, isOverdue } from '../domain/dates';
import type { Status, Task, Workspace } from '../domain/model';
import { Checkbox } from './checkbox';
import { Button, Options, Select, human, statuses } from './ui';

const taskRow = cva({
  base: 'task-row',
  variants: {
    child: { true: 'task-child', false: '' },
    completed: { true: 'task-completed', false: '' },
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
      className={taskRow({ child: !!parent, completed: task.status === 'completed' })}
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
      <div className="min-w-0 flex-1">
        <button
          className={`title-link ${task.status === 'completed' ? 'completed' : ''}`}
          onClick={() => onEdit(task.id)}
        >
          {task.title}
        </button>
        {showContext && (
          <div className="row-subtitle">
            {w.topics.find((t) => t.id === task.topicId)?.title}
            {parent && ` / ${parent.title}`} · {task.owner || 'Unassigned'} · {human(task.priority)}
            {task.recurrence !== 'none' && (
              <span className="inline-icon">
                <IconRepeat size={13} />
                {human(task.recurrence)}
              </span>
            )}
            {task.recurrenceRootId && ' · Recurring instance'}
          </div>
        )}
        {(sources.length > 0 || files.length > 0) && (
          <ul className="task-resources" aria-label={`Resources for ${task.title}`}>
            {sources.map((source) => (
              <li key={source.id}>
                <button
                  type="button"
                  className="source-chip task-resource"
                  aria-label={`View source ${source.title}${source.identifier ? ` · ${source.identifier}` : ''}`}
                  onClick={() => onOpenSource(source.id)}
                >
                  <IconLink size={13} aria-hidden="true" />
                  <span>
                    {source.title}
                    {source.identifier && ` · ${source.identifier}`}
                  </span>
                </button>
              </li>
            ))}
            {files.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className="source-chip task-resource"
                  aria-label={`Open file ${file.originalName}`}
                  disabled={busy}
                  onClick={() => onOpenFile(file.id)}
                >
                  <IconPaperclip size={13} aria-hidden="true" />
                  <span>{file.originalName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {task.nextAction && <p className="row-action">Next: {task.nextAction}</p>}
      </div>
      <div className="task-actions">
        {task.dueDate && (
          <span className={isOverdue(task) ? 'overdue text-sm' : 'muted text-sm'}>
            {isOverdue(task) && 'Overdue · '}
            {formatDate(task.dueDate)}
          </span>
        )}
        <Select
          className="compact-select"
          aria-label={`Status of ${task.title}`}
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatus(task.id, e.target.value as Status)}
        >
          <Options values={statuses} />
        </Select>
        <Button
          size="sm"
          className="task-action"
          disabled={busy}
          aria-label={`Add subtask to ${task.title}`}
          onClick={() => onAddSubtask(task)}
        >
          <IconPlus size={16} />
        </Button>
        <Button
          size="sm"
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
