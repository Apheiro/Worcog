'use client';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { IconGripVertical } from '@tabler/icons-react';
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
} from '@dnd-kit/react';
import { Feedback, PointerActivationConstraints } from '@dnd-kit/dom';
import { pointerIntersection } from '@dnd-kit/collision';
import {
  canReparentTask,
  orderTasksForDisplay,
  type TaskMove,
  type TaskSort,
} from '../application/task-order';
import { moveTask } from '../application/task-movement';
import type { Task } from '../domain/model';
import { useWorcog } from '../providers/worcog';
import { Button, Empty } from './core';
import { TaskRow, type TaskRowProps } from './task-row';
import { TaskConnections } from './task-connections';

const sensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  KeyboardSensor,
];

type ListRowProps = Omit<TaskRowProps, 'dragHandle' | 'cardRef' | 'dropTarget'>;
type DropData = TaskMove & { label: string };

function TaskDropLine({
  id,
  move,
  label,
  disabled,
  detached = false,
}: {
  id: string;
  move: TaskMove;
  label: string;
  disabled: boolean;
  detached?: boolean;
}) {
  const { ref, isDropTarget } = useDroppable<DropData>({
    id,
    data: { ...move, label },
    disabled,
    collisionDetector: pointerIntersection,
  });
  return (
    <div
      ref={ref}
      aria-label={label}
      className={
        detached
          ? `mb-2 rounded-[5px] border border-dashed px-3 py-2 text-xs ${isDropTarget ? '[border-color:var(--ink)] [background:var(--selected)] [color:var(--ink)]' : '[border-color:var(--border)] [color:var(--muted)]'}`
          : 'absolute inset-x-0 -top-[9px] z-10 h-[14px]'
      }
    >
      {detached ? (
        label
      ) : (
        <span
          className={`pointer-events-none absolute inset-x-0 top-1/2 h-px ${isDropTarget ? '[background:var(--ink)]' : '[background:var(--border-strong)]'}`}
        />
      )}
      {isDropTarget && !detached && (
        <span className="pointer-events-none absolute right-2 bottom-full rounded px-2 py-1 text-[10px] [background:var(--ink)] [color:var(--surface)]">
          {label}
        </span>
      )}
    </div>
  );
}

function DraggableTaskRow({ activeTask, ...props }: ListRowProps & { activeTask: Task | null }) {
  const tr = useTranslations('ui');
  const { task, workspace, busy } = props;
  const { relations } = useWorcog();
  const { ref: dragRef, handleRef } = useDraggable({
    id: task.id,
    disabled: busy || !!relations.source,
  });
  const canNest =
    !!activeTask &&
    activeTask.parentId !== task.id &&
    canReparentTask(workspace.tasks, activeTask.id, task.id);
  const { ref: dropRef, isDropTarget } = useDroppable<DropData>({
    id: `child:${task.id}`,
    disabled: busy || !canNest,
    data: { parentId: task.id, label: tr('make_subtask_of_value0', { value0: task.title }) },
    collisionDetector: pointerIntersection,
  });
  const cardRef = useCallback(
    (element: HTMLElement | null) => {
      dragRef(element);
      dropRef(element);
    },
    [dragRef, dropRef],
  );
  return (
    <div className="relative flex min-w-0 flex-col gap-[5px]">
      <TaskRow
        {...props}
        cardRef={cardRef}
        dropTarget={isDropTarget}
        dragHandle={
          !relations.source && (
            <Button
              ref={handleRef}
              type="button"
              tone="ghost"
              size="auto"
              disabled={busy}
              aria-label={tr('move_value0', { value0: task.title })}
              title={tr('drag_to_change_hierarchy_select_order_by_free_to_reorder')}
              className={`absolute right-0 top-1/2 z-0 h-8 w-5 -translate-y-1/2 rounded-l-none rounded-r-[5px] cursor-grab touch-none p-0 [background:var(--surface-soft)] [border:1px_solid_var(--border)] [color:var(--muted)] [transition-property:transform,opacity] duration-150 motion-reduce:transition-none active:cursor-grabbing group-hover/task-card:translate-x-[calc(100%_-_1px)] group-hover/task-card:opacity-100 group-hover/task-card:pointer-events-auto group-focus-within/task-card:translate-x-[calc(100%_-_1px)] group-focus-within/task-card:opacity-100 group-focus-within/task-card:pointer-events-auto [@media(hover:none)]:translate-x-[calc(100%_-_1px)] [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto ${activeTask?.id === task.id ? 'translate-x-[calc(100%_-_1px)] opacity-100 pointer-events-auto' : 'translate-x-0 opacity-0 pointer-events-none'}`}
            >
              <IconGripVertical size={14} aria-hidden="true" />
            </Button>
          )
        }
      />
      {isDropTarget && (
        <span className="pointer-events-none absolute right-2 top-0 z-10 -translate-y-1/2 rounded px-2 py-1 text-[10px] [background:var(--ink)] [color:var(--surface)]">
          {tr('make_subtask_of')} {task.title}
        </span>
      )}
    </div>
  );
}

export function TaskList({
  tasks,
  sort = 'created',
  ...rowProps
}: Omit<ListRowProps, 'task' | 'childrenExpanded' | 'onToggleChildren'> & {
  tasks: Task[];
  sort?: TaskSort;
}) {
  const tr = useTranslations('ui');
  const { wb, relations } = useWorcog();
  const container = useRef<HTMLDivElement>(null);
  const { workspace, busy } = rowProps;
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const roots: Task[] = [];
  const children = new Map<string, Task[]>();
  const placed = new Set<string>();
  for (const task of orderTasksForDisplay(tasks, sort)) {
    if (task.parentId && placed.has(task.parentId)) {
      const siblings = children.get(task.parentId) ?? [];
      siblings.push(task);
      children.set(task.parentId, siblings);
    } else roots.push(task);
    placed.add(task.id);
  }
  function branches(items: Task[]): ReactNode {
    return items.map((task, index) => {
      const descendants = children.get(task.id) ?? [];
      const expanded = !collapsed.has(task.id);
      const canInsert =
        !!activeTask &&
        activeTask.id !== task.id &&
        activeTask.topicId === task.topicId &&
        canReparentTask(workspace.tasks, activeTask.id, task.parentId);
      const nextSibling = items.slice(index + 1).find((item) => item.parentId === task.parentId);
      const showEnd = !nextSibling || nextSibling.topicId !== task.topicId;
      return (
        <li key={task.id} className="relative flex min-w-0 flex-col gap-[5px]">
          {activeTask && sort === 'free' && canInsert && (
            <TaskDropLine
              id={`before:${task.id}`}
              move={{ parentId: task.parentId, beforeId: task.id }}
              label={tr('move_before_value0', { value0: task.title })}
              disabled={busy}
            />
          )}
          <DraggableTaskRow
            {...rowProps}
            task={task}
            activeTask={activeTask}
            childrenExpanded={descendants.length ? expanded : undefined}
            onToggleChildren={
              descendants.length
                ? () => {
                    setCollapsed((previous) => {
                      const next = new Set(previous);
                      if (next.has(task.id)) next.delete(task.id);
                      else next.add(task.id);
                      return next;
                    });
                  }
                : undefined
            }
          />
          {descendants.length > 0 && expanded && (
            <ul
              aria-label={tr('subtasks_of_value0', { value0: task.title })}
              className="relative m-0 flex min-w-0 list-none flex-col gap-[5px] py-0 pr-0 [padding-left:calc(1.25rem_+_1px_+_0.75rem)] before:content-empty before:absolute before:-top-[5px] before:bottom-0 before:[left:calc(1.25rem_+_1px)] before:-translate-x-1/2 before:w-px before:[background:var(--border)] before:pointer-events-none"
            >
              {branches(descendants)}
            </ul>
          )}
          {activeTask && sort === 'free' && canInsert && showEnd && (
            <div className="relative h-0">
              <TaskDropLine
                id={`after:${task.id}`}
                move={{ parentId: task.parentId, beforeId: nextSibling?.id ?? null }}
                label={tr('move_after_value0', { value0: task.title })}
                disabled={busy}
              />
            </div>
          )}
        </li>
      );
    });
  }
  if (!tasks.length)
    return (
      <Empty title={tr('no_tasks_in_this_view')}>
        {' '}
        {tr('tasks_added_to_a_topic_will_appear_here')}{' '}
      </Empty>
    );
  const parent = workspace.tasks.find((task) => task.id === activeTask?.parentId);
  return (
    <DragDropProvider<DropData>
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ feedback: 'clone', dropAnimation: null }),
      ]}
      onDragStart={({ operation }) => {
        setActiveTask(workspace.tasks.find((task) => task.id === operation.source?.id) ?? null);
      }}
      onDragEnd={(event) => {
        setActiveTask(null);
        const { source, target } = event.operation;
        if (event.canceled || busy || relations.source || !source || !target) return;
        const data = target.data;
        const id = String(source.id);
        const moving = workspace.tasks.find((task) => task.id === id);
        if (!moving || (sort !== 'free' && moving.parentId === data.parentId)) return;
        void wb
          .update((value) => moveTask(value, id, data, sort), {}, false)
          .then((saved) => {
            const parentId = data.parentId;
            if (saved && parentId)
              setCollapsed((previous) => {
                const next = new Set(previous);
                next.delete(parentId);
                return next;
              });
          });
      }}
    >
      {activeTask?.parentId && (
        <div className="flex flex-wrap gap-2">
          <TaskDropLine
            id="main-tasks"
            move={{ parentId: null }}
            label={tr('move_to_main_tasks')}
            disabled={busy}
            detached
          />
          {parent?.parentId && (
            <TaskDropLine
              id="up-one-level"
              move={{ parentId: parent.parentId }}
              label={tr('move_up_one_level')}
              disabled={busy}
              detached
            />
          )}
        </div>
      )}
      <div ref={container} className="relative isolate">
        <TaskConnections container={container} />
        <ul
          className="task-list relative m-0 flex list-none flex-col gap-[5px] p-0"
          aria-label={tr('task_hierarchy')}
        >
          {branches(roots)}
        </ul>
      </div>
    </DragDropProvider>
  );
}
