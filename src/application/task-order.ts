import type { Task } from '../domain/model';

/** Keep the incoming order between roots/siblings, but render each parent before
 * its descendants. Filtered-out ancestors are not added back into the results. */
export function orderTasksForDisplay(tasks: readonly Task[]): Task[] {
  const visible = new Set(tasks.map((task) => task.id));
  const children = new Map<string, Task[]>();
  const roots: Task[] = [];
  for (const task of tasks) {
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
