import type { Workspace } from '../domain/model';
import { canReparentTask, compareTaskOrder, type TaskMove, type TaskSort } from './task-order';
import { applyWorkspaceChanges } from './workspace-changes';

/** Persist hierarchy and Free order together, without touching Free order in other modes. */
export function moveTask(
  workspace: Workspace,
  id: string,
  move: TaskMove,
  sort: TaskSort,
  now = new Date().toISOString(),
): Workspace {
  const task = workspace.tasks.find((item) => item.id === id);
  if (!task || !canReparentTask(workspace.tasks, id, move.parentId))
    throw new Error('Tasks can only move within their topic and outside their own descendants.');
  const reparenting = task.parentId !== move.parentId;
  if (sort !== 'free') {
    if (!reparenting) return workspace;
    return applyWorkspaceChanges(workspace, {
      tasks: workspace.tasks.map((item) => item.id === id ? {
        ...item,
        // Bind old saved positions before changing groups, including legacy orders.
        ...(item.order !== undefined && item.orderParentId === undefined ? { orderParentId: item.parentId } : {}),
        parentId: move.parentId,
        updatedAt: now,
      } : item),
    }, now);
  }

  // Include hidden/filtered siblings so moving visible rows never loses their order.
  const siblings = workspace.tasks
    .filter((item) => item.parentId === move.parentId)
    .sort((a, b) => compareTaskOrder(a, b, 'free'));
  const remaining = siblings.filter((item) => item.id !== id);
  const index = move.beforeId == null ? remaining.length : remaining.findIndex((item) => item.id === move.beforeId);
  if (index < 0) throw new Error('The destination task no longer belongs to this group.');
  remaining.splice(index, 0, task);
  if (!reparenting && siblings.every((item, position) => item.id === remaining[position]?.id)) return workspace;
  const positions = new Map(remaining.map((item, position) => [item.id, position]));
  return applyWorkspaceChanges(workspace, {
    tasks: workspace.tasks.map((item) => {
      const order = positions.get(item.id);
      if (order === undefined) return item;
      if (item.id !== id && item.order === order && item.orderParentId === move.parentId) return item;
      return {
        ...item,
        parentId: move.parentId,
        order,
        orderParentId: move.parentId,
        ...(item.id === id ? { updatedAt: now } : {}),
      };
    }),
  }, now);
}
