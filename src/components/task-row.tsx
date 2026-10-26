'use client';
import { useLabels } from '../i18n/use-labels';
import { useDates } from '../i18n/use-dates';
import { useTranslations } from 'next-intl';
import {
  IconChevronDown,
  IconChevronRight,
  IconPaperclip,
  IconPlus,
  IconRepeat,
  IconTrash,
  IconAlertTriangle,
  IconLock,
  IconLockOpen,
  IconNotes,
  IconTimeline,
  IconLink,
} from '@tabler/icons-react';
import { useId, useState, type FormEvent, type ReactNode, type Ref } from 'react';
import { cva } from 'cva';
import dayjs from 'dayjs';
import { isOverdue } from '../domain/dates';
import type { Status, Task, Workspace } from '../domain/model';
import { assignedNames } from '../domain/responsibles';
import { Checkbox } from './core/checkbox';
import {
  ActionMenu,
  ContextMenu,
  Button,
  Card,
  Field,
  Modal,
  Textarea,
  Tooltip,
  type ActionMenuItem,
} from './core';
import { deadlineIndicator } from '../application/topic-inactivity';
import { human, taskPriority } from '../domain/options';
import { useWorcog } from '../providers/worcog';
import { AttachmentStatus } from './attachment-status';
import { TaskProgress, TaskUpdateForm } from './task-progress';
import { SourceIcon } from './source-icon';
import { EntityLinks, EntityLinkIndicator, useLinkTarget } from './entity-links';
import { shortcutLabel } from '../domain/shortcuts';
import { useIndicatorText } from '../i18n/use-indicator-text';

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
  dragHandle?: ReactNode;
  cardRef?: Ref<HTMLElement>;
  dropTarget?: boolean;
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
  dragHandle,
  cardRef,
  dropTarget,
}: TaskRowProps) {
  const localize = useLabels();
  const { formatDate } = useDates();
  const tr = useTranslations('ui');
  const {
    inactivitySettings,
    attachmentExport,
    taskContextMenu,
    relations,
    showTaskRelations,
    shortcuts,
    taskFileDrop,
  } = useWorcog();
  const receivingFile = taskFileDrop.targetId === task.id || taskFileDrop.pendingId === task.id;
  const entity = { kind: 'task' as const, id: task.id };
  const linkTarget = useLinkTarget(entity);
  const parent = w.tasks.find((t) => t.id === task.parentId);
  const sources = w.sources.filter((source) => task.sourceIds.includes(source.id));
  const files = w.attachments.filter((file) => file.taskIds.includes(task.id));
  const deadline = deadlineIndicator(
    task.createdAt,
    task.dueDate,
    inactivitySettings,
    task.status === 'completed' && task.completedAt ? dayjs(task.completedAt) : undefined,
  );
  const [blocking, setBlocking] = useState(false);
  const deadlineLabel = useIndicatorText(deadline);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [updatesExpanded, setUpdatesExpanded] = useState(false);
  const updatesRegionId = useId();
  const blockFormId = useId();
  const updates = w.activities.filter(
    (activity) => activity.kind === 'progress' && activity.taskIds.includes(task.id),
  );
  const [reason, setReason] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  const blocked = task.status === 'blocked';
  const actions: ActionMenuItem[] = [
    { label: tr('link'), icon: <IconLink size={15} />, onSelect: () => relations.start(entity) },
    {
      label: tr('add_update'),
      icon: <IconNotes size={15} />,
      opensDialog: true,
      onSelect: () => setAddingUpdate(true),
    },
    {
      label: tr('add_subtask'),
      icon: <IconPlus size={15} />,
      opensDialog: true,
      onSelect: () => onAddSubtask(task),
    },
    {
      label: tr('remove'),
      icon: <IconTrash size={15} />,
      destructive: true,
      opensDialog: true,
      onSelect: () => onDelete(task.id),
    },
    {
      label: blocked ? tr('unblocked') : tr('blocked'),
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
  ];
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
      <div className="group/task-card relative isolate">
        <ContextMenu
          label={tr('actions_for_value0', { value0: task.title })}
          items={actions}
          shortcut={shortcuts.active.contextMenu}
          disabled={!taskContextMenu || busy || linkTarget.choosing}
        >
          <Card
            {...linkTarget.props}
            ref={cardRef}
            data-task-file-drop={task.id}
            className={taskRow({
              completed: task.status === 'completed',
              className: `relative z-10 [&.card[data-link-source=true]]:[border-color:var(--ink)] [&.card[data-link-source=true]]:[background:var(--selected)] [&.card[data-link-target=true]]:cursor-crosshair [&.card[data-link-target=true]:hover]:[border-color:var(--ink)] [&.card[data-linked-highlight=true]]:[border-color:var(--secondary)] ${dropTarget || receivingFile ? '[&.card]:[border-color:var(--ink)] [&.card]:[background:var(--selected)]' : ''}`,
            })}
            role="group"
            aria-label={task.title}
            aria-busy={busy || taskFileDrop.pendingId === task.id}
          >
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <Checkbox
                appearance="task"
                aria-label={tr('mark_value0_value1', {
                  value0: task.title,
                  value1:
                    task.status === 'completed' ? tr('in_progress_lower') : tr('completed_lower'),
                })}
                checked={task.status === 'completed'}
                disabled={busy}
                onCheckedChange={(checked) =>
                  void onStatus(task.id, checked === true ? 'completed' : 'in_progress')
                }
              />
              {deadline && (
                <span
                  role="img"
                  title={deadlineLabel}
                  aria-label={deadlineLabel}
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
                    aria-label={tr('value0_subtasks_of_value1', {
                      value0: childrenExpanded ? tr('collapse') : tr('expand'),
                      value1: task.title,
                    })}
                    onClick={onToggleChildren}
                  >
                    {childrenExpanded ? (
                      <IconChevronDown size={14} />
                    ) : (
                      <IconChevronRight size={14} />
                    )}
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
                  {parent && ` / ${parent.title}`} ·{' '}
                  {assignedNames(task).join(', ') || tr('unassigned')} ·{' '}
                  {localize(human(taskPriority(task.priority)))}
                  {task.recurrence !== 'none' && (
                    <span className="inline-icon inline-flex [gap:4px] items-center">
                      <IconRepeat size={13} />
                      {localize(human(task.recurrence))}
                    </span>
                  )}
                  {task.recurrenceRootId && tr('recurring_instance')}
                </div>
              )}
              {(sources.length > 0 || files.length > 0) && (
                <ul
                  className="task-resources flex flex-wrap gap-1.5 m-0 list-none p-0 [&_li]:min-w-0 [&_li]:max-w-full"
                  aria-label={tr('resources_for_value0', { value0: task.title })}
                >
                  {sources.map((source) => (
                    <li key={source.id}>
                      <Button
                        tone="chip"
                        size="auto"
                        type="button"
                        className="task-resource max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={tr('view_source_value0_value1', {
                          value0: source.title,
                          value1: source.identifier ? ` · ${source.identifier}` : '',
                        })}
                        onClick={() => onOpenSource(source.id)}
                      >
                        <SourceIcon kind={source.kind} size={13} />
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
                        className={`task-resource max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${attachmentExport.selectedIds.has(file.id) ? '[&.button]:[background:var(--selected)] [&.button]:[border-color:var(--ink)] [&.button]:[color:var(--ink)]' : ''}`}
                        aria-label={tr('open_file_value0_value1_click_to_select_for_export', {
                          value0: file.originalName,
                          value1: shortcutLabel(
                            shortcuts.active.selectFileModifier,
                            shortcuts.platform,
                          ),
                        })}
                        aria-pressed={attachmentExport.selectedIds.has(file.id)}
                        title={tr('value0_click_to_select_or_deselect_for_export', {
                          value0: shortcutLabel(
                            shortcuts.active.selectFileModifier,
                            shortcuts.platform,
                          ),
                        })}
                        disabled={busy}
                        onClick={(event) => {
                          if (shortcuts.selectsFile(event)) attachmentExport.toggle(file.id);
                          else onOpenFile(file.id);
                        }}
                        onKeyDown={(event) => {
                          if (
                            shortcuts.selectsFile(event) &&
                            (event.key === 'Enter' || event.key === ' ')
                          ) {
                            event.preventDefault();
                            if (!event.repeat) attachmentExport.toggle(file.id);
                          }
                        }}
                      >
                        <IconPaperclip size={13} aria-hidden="true" />
                        <span>
                          {file.originalName}
                          <AttachmentStatus id={file.id} />
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {showTaskRelations && <EntityLinks entity={entity} />}
              {taskFileDrop.pendingId === task.id && (
                <span role="status" className="text-xs [color:var(--muted)]">
                  {tr('attaching')}
                </span>
              )}
            </div>
            <div className="task-actions ml-auto flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {blocked && (
                  <Tooltip content={task.blockReason || tr('no_block_reason')}>
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label={tr('blocked_value0', {
                        value0: task.blockReason || tr('no_block_reason'),
                      })}
                      className="inline-flex shrink-0 [color:var(--blocked-ink)] rounded focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]"
                    >
                      <IconAlertTriangle size={16} aria-hidden="true" />
                    </span>
                  </Tooltip>
                )}
                {updates.length > 0 && (
                  <Tooltip
                    content={tr('updates_toggle', {
                      action: updatesExpanded ? tr('hide') : tr('show'),
                      count: updates.length,
                    })}
                  >
                    <Button
                      type="button"
                      tone="ghost"
                      size="auto"
                      className={`h-5 w-5 shrink-0 p-0 ${updatesExpanded ? '[color:var(--ink)]' : '[color:var(--muted)]'}`}
                      aria-label={tr('value0_updates_for_value1', {
                        value0: updatesExpanded ? tr('collapse') : tr('expand'),
                        value1: task.title,
                      })}
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
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label={tr('task_description')}
                      className="inline-flex shrink-0 [color:var(--muted)] rounded focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]"
                    >
                      <IconNotes size={16} aria-hidden="true" />
                    </span>
                  </Tooltip>
                )}
                {!taskContextMenu && (
                  <ActionMenu
                    label={tr('actions_for_value0', { value0: task.title })}
                    disabled={busy || linkTarget.choosing}
                    items={actions}
                  />
                )}
              </div>
              {task.dueDate && (
                <span className="text-xs [color:var(--muted)]">
                  {isOverdue(task) && tr('overdue')}
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </Card>
        </ContextMenu>
        <EntityLinkIndicator entity={entity} />
        {dragHandle}
      </div>
      {updatesExpanded && <TaskProgress task={task} entries={updates} regionId={updatesRegionId} />}
      {addingUpdate && <TaskUpdateForm task={task} onClose={() => setAddingUpdate(false)} />}
      {blocking && (
        <Modal
          title={tr('block_task')}
          description={task.title}
          footer={
            <>
              <Button
                type="button"
                disabled={busy || savingBlock}
                onClick={() => setBlocking(false)}
              >
                {tr('cancel')}{' '}
              </Button>
              <Button
                type="submit"
                form={blockFormId}
                tone="primary"
                disabled={busy || savingBlock || !reason.trim()}
              >
                {tr('block_task')}{' '}
              </Button>
            </>
          }
          onClose={() => {
            if (!busy && !savingBlock) setBlocking(false);
          }}
        >
          <form id={blockFormId} onSubmit={(event) => void block(event)}>
            <Field label={tr('reason')} hint={tr('a_reason_is_required_to_block_this_task')}>
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
          </form>
        </Modal>
      )}
    </>
  );
}
