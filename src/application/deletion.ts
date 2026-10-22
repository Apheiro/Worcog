import type { Workspace } from '../domain/model';
import { emptyWorkspace } from '../domain/model';
import { attachmentTopicIds, sourceTopicIds } from '../domain/relationships';
import { applyWorkspaceChanges } from './workspace-changes';
import { planTaskDeletion } from './task-deletion';
export type DeletionTarget =
  { kind: 'topic' | 'source' | 'activity' | 'attachment'; id: string } | { kind: 'workspace' };

/** Remove owned records; shared references are unlinked, not silently destroyed. */
export function deleteEntity(
  workspace: Workspace,
  target: DeletionTarget,
  now = new Date().toISOString(),
): Workspace {
  if (target.kind === 'workspace') return { ...emptyWorkspace(), revision: workspace.revision + 1 };
  const collection =
    target.kind === 'topic'
      ? workspace.topics
      : target.kind === 'source'
        ? workspace.sources
        : target.kind === 'activity'
          ? workspace.activities
          : workspace.attachments;
  if (!collection.some((item) => item.id === target.id))
    throw new Error('The selected item no longer exists.');
  const topicIds = new Set(target.kind === 'topic' ? [target.id] : []);
  const taskIds = new Set<string>();
  const activityIds = new Set(target.kind === 'activity' ? [target.id] : []);
  const sourceIds = new Set(target.kind === 'source' ? [target.id] : []);
  const attachmentIds = new Set(target.kind === 'attachment' ? [target.id] : []);
  const fileCandidates = new Set<string>();
  const sourceCandidates = new Set<string>();
  if (target.kind === 'topic') {
    for (const task of workspace.tasks) {
      if (!topicIds.has(task.topicId) || taskIds.has(task.id)) continue;
      const plan = planTaskDeletion(workspace, task.id);
      plan.taskIds.forEach((id) => taskIds.add(id));
      plan.activityIds.forEach((id) => activityIds.add(id));
    }
    for (const source of workspace.sources)
      if (sourceTopicIds(workspace, source).includes(target.id)) sourceCandidates.add(source.id);
    for (const file of workspace.attachments)
      if (attachmentTopicIds(workspace, file).includes(target.id)) fileCandidates.add(file.id);
  }
  let activities = workspace.activities
    .filter((activity) => !activityIds.has(activity.id))
    .map((activity) => {
      const linkedTopics = activity.topicIds.filter((id) => !topicIds.has(id));
      if (linkedTopics.length === activity.topicIds.length) return activity;
      if (!linkedTopics.length && !activity.taskIds.some((id) => !taskIds.has(id))) {
        activityIds.add(activity.id);
        return null;
      }
      return { ...activity, topicIds: linkedTopics, updatedAt: now };
    })
    .filter((activity) => activity !== null);
  const tasks = workspace.tasks.filter((task) => !taskIds.has(task.id));
  let sources = workspace.sources.map((source) => {
    const linkedTopics = source.topicIds.filter((id) => !topicIds.has(id));
    return linkedTopics.length === source.topicIds.length
      ? source
      : { ...source, topicIds: linkedTopics, updatedAt: now };
  });
  for (const source of sources) {
    if (
      sourceCandidates.has(source.id) &&
      !source.topicIds.length &&
      !tasks.some((task) => task.sourceIds.includes(source.id)) &&
      !activities.some((activity) => activity.sourceIds.includes(source.id))
    )
      sourceIds.add(source.id);
  }
  sources = sources.filter((source) => !sourceIds.has(source.id));
  activities = activities.map((activity) => {
    const ids = activity.sourceIds.filter((id) => !sourceIds.has(id));
    return ids.length === activity.sourceIds.length
      ? activity
      : { ...activity, sourceIds: ids, updatedAt: now };
  });
  const attachments = workspace.attachments
    .filter((file) => !attachmentIds.has(file.id))
    .map((file) => {
      if (
        file.activityIds.some((id) => activityIds.has(id)) ||
        file.sourceIds.some((id) => sourceIds.has(id))
      )
        fileCandidates.add(file.id);
      const updated = {
        ...file,
        topicIds: file.topicIds.filter((id) => !topicIds.has(id)),
        taskIds: file.taskIds.filter((id) => !taskIds.has(id)),
        activityIds: file.activityIds.filter((id) => !activityIds.has(id)),
        sourceIds: file.sourceIds.filter((id) => !sourceIds.has(id)),
      };
      if (
        fileCandidates.has(file.id) &&
        !updated.topicIds.length &&
        !updated.taskIds.length &&
        !updated.activityIds.length &&
        !updated.sourceIds.length
      )
        return null;
      return updated.topicIds.length === file.topicIds.length &&
        updated.taskIds.length === file.taskIds.length &&
        updated.activityIds.length === file.activityIds.length &&
        updated.sourceIds.length === file.sourceIds.length
        ? file
        : updated;
    })
    .filter((file) => file !== null);
  return applyWorkspaceChanges(
    workspace,
    {
      topics: workspace.topics
        .filter((topic) => !topicIds.has(topic.id))
        .map((topic) => {
          const ids = topic.relatedTopicIds.filter((id) => !topicIds.has(id));
          return ids.length === topic.relatedTopicIds.length
            ? topic
            : { ...topic, relatedTopicIds: ids, updatedAt: now };
        }),
      tasks: tasks.map((task) => {
        const ids = task.sourceIds.filter((id) => !sourceIds.has(id));
        return ids.length === task.sourceIds.length
          ? task
          : { ...task, sourceIds: ids, updatedAt: now };
      }),
      activities,
      sources,
      attachments,
    },
    now,
  );
}

export function deletionPreview(workspace: Workspace, target: DeletionTarget) {
  const next = deleteEntity(workspace, target);
  const counts = {
    topics: workspace.topics.length - next.topics.length,
    tasks: workspace.tasks.length - next.tasks.length,
    annotations: workspace.activities.length - next.activities.length,
    sources: workspace.sources.length - next.sources.length,
    files: workspace.attachments.length - next.attachments.length,
  };
  return {
    counts,
    description: Object.entries(counts)
      .map(([kind, count]) => `${count} ${kind === 'annotations' ? 'activity records' : kind}`)
      .join(', '),
  };
}
