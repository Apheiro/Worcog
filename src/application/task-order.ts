import type { Task } from '../domain/model';

export const taskSortOptions = [
  { value: 'free', label: 'Free' },
  { value: 'created', label: 'Creation date · oldest first' },
  { value: 'newest', label: 'Creation date · newest first' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Name' },
] as const;
export type TaskSort = typeof taskSortOptions[number]['value'];

export function filterCompletedRootTasks(tasks: Task[], hideCompleted: boolean): Task[] {
  return tasks.filter((task) => !hideCompleted || !!task.parentId || task.status !== 'completed');
}

export function compareTaskOrder(a: Task, b: Task, sort: TaskSort = 'created') {
  const created = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  const rank = { urgent: 0, high: 0, normal: 1, low: 2 };
  const compared = sort === 'free' ? freePosition(a) - freePosition(b)
    : sort === 'newest' ? -created
    : sort === 'deadline' ? (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    : sort === 'priority' ? rank[a.priority] - rank[b.priority]
    : sort === 'title' ? a.title.localeCompare(b.title)
    : created;
  return compared || created || a.id.localeCompare(b.id);
}

function freePosition(task: Task): number {
  return task.order !== undefined && (task.orderParentId === undefined || task.orderParentId === task.parentId)
    ? task.order
    : Number.MAX_SAFE_INTEGER;
}

/** A task can only move within its topic, never into itself or a descendant. */
export function canReparentTask(tasks: readonly Task[], id: string, parentId: string | null): boolean {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const task = byId.get(id);
  if (!task) return false;
  const seen = new Set([id]);
  let current = parentId;
  while (current !== null) {
    if (seen.has(current)) return false;
    seen.add(current);
    const parent = byId.get(current);
    if (!parent || parent.topicId !== task.topicId) return false;
    current = parent.parentId;
  }
  return true;
}

export type TaskMove = {
  parentId: string | null;
  /** Insert before this sibling in Free mode; null appends to the group. */
  beforeId?: string | null;
};

/** Sort roots/siblings by the selected criterion, and render each parent before
 * its descendants. Filtered-out ancestors are not added back into the results. */
export function orderTasksForDisplay(tasks: readonly Task[], sort: TaskSort = 'created'): Task[] {
  const visible = new Set(tasks.map((task) => task.id));
  const children = new Map<string, Task[]>();
  const roots: Task[] = [];
  for (const task of [...tasks].sort((a, b) => compareTaskOrder(a, b, sort))) {
    if (!task.parentId || !visible.has(task.parentId)) roots.push(task);
    else {
      const siblings = children.get(task.parentId) ?? [];
      siblings.push(task);
      children.set(task.parentId, siblings);
    }
  }
  const ordered: Task[] = [];
  const seen = new Set<string>();
  function visit(branches: readonly Task[]) {
    const stack = [...branches].reverse();
    while (stack.length) {
      const task = stack.pop()!;
      if (seen.has(task.id)) continue;
      seen.add(task.id);
      ordered.push(task);
      const descendants = children.get(task.id) ?? [];
      for (let index = descendants.length - 1; index >= 0; index--) stack.push(descendants[index]);
    }
  }
  visit(roots);
  // Persisted data is validated, but this guard prevents hidden rows or an
  // infinite traversal if a caller ever supplies an invalid cyclic subset.
  visit(tasks.filter((task) => !seen.has(task.id)));
  return ordered;
}
