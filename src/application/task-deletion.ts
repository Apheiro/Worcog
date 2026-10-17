import type { Workspace } from '../domain/model';
import { applyWorkspaceChanges } from './workspace-changes';

export interface TaskDeletionPlan {
  taskIds: string[];
  activityIds: string[];
  sharedActivityCount: number;
  includesRecurrence: boolean;
}
/** A recurrence family must be removed together; keeping its root would recreate
 * deleted occurrences on refresh and would require a deletion-history tombstone. */
export function planTaskDeletion(workspace: Workspace, id: string): TaskDeletionPlan {
  if (!workspace.tasks.some((task) => task.id === id))
    throw new Error('The selected task no longer exists.');
  const related = new Map<string, string[]>();
  const connect = (from: string, to: string) => {
    const ids = related.get(from) ?? [];
    ids.push(to);
    related.set(from, ids);
  };
  for (const task of workspace.tasks) {
    if (task.parentId) connect(task.parentId, task.id);
    if (task.recurrenceRootId) {
      connect(task.recurrenceRootId, task.id);
      connect(task.id, task.recurrenceRootId);
    }
  }
  const deleted = new Set<string>();
  const pending = [id];
  while (pending.length) {
    const next = pending.pop()!;
    if (deleted.has(next)) continue;
    deleted.add(next);
    for (const relatedId of related.get(next) ?? []) pending.push(relatedId);
  }
  const affectedTopics = new Set(
    workspace.tasks.filter((task) => deleted.has(task.id)).map((task) => task.topicId),
  );
  const activities = workspace.activities.filter((activity) =>
    activity.taskIds.some((taskId) => deleted.has(taskId)),
  );
  return {
    taskIds: workspace.tasks.filter((task) => deleted.has(task.id)).map((task) => task.id),
    activityIds: activities.map((activity) => activity.id),
    sharedActivityCount: activities.filter(
      (activity) =>
        activity.topicIds.length > 1 ||
        activity.topicIds.some((topicId) => !affectedTopics.has(topicId)) ||
        activity.taskIds.some((taskId) => !deleted.has(taskId)),
    ).length,
    includesRecurrence: workspace.tasks.some(
      (task) =>
        deleted.has(task.id) && (task.recurrence !== 'none' || task.recurrenceRootId !== null),
    ),
  };
}

/** Permanently remove live task records and all linked activity (including text
 * revisions). No deletion event, canceled task, recycle-bin entry or tombstone. */
export function deleteTask(
  workspace: Workspace,
  id: string,
  now = new Date().toISOString(),
): Workspace {
  const plan = planTaskDeletion(workspace, id);
  const tasks = new Set(plan.taskIds);
  const activities = new Set(plan.activityIds);
  return applyWorkspaceChanges(
    workspace,
    {
      tasks: workspace.tasks.filter((task) => !tasks.has(task.id)),
      activities: workspace.activities.filter((activity) => !activities.has(activity.id)),
      attachments: workspace.attachments.map((file) => {
        const taskIds = file.taskIds.filter((taskId) => !tasks.has(taskId));
        const activityIds = file.activityIds.filter((activityId) => !activities.has(activityId));
        return taskIds.length === file.taskIds.length &&
          activityIds.length === file.activityIds.length
          ? file
          : { ...file, taskIds, activityIds };
      }),
    },
    now,
  );
}
