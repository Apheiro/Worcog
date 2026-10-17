import type { Activity, Attachment, Source, Workspace } from './model';

export function activityTopicIds(workspace: Workspace, activity: Activity): string[] {
  return [
    ...new Set([
      ...activity.topicIds,
      ...workspace.tasks
        .filter((task) => activity.taskIds.includes(task.id))
        .map((task) => task.topicId),
    ]),
  ];
}

/** Include references made through tasks and annotations, not only direct links. */
export function sourceTopicIds(workspace: Workspace, source: Source): string[] {
  return [
    ...new Set([
      ...source.topicIds,
      ...workspace.tasks
        .filter((task) => task.sourceIds.includes(source.id))
        .map((task) => task.topicId),
      ...workspace.activities
        .filter((activity) => activity.sourceIds.includes(source.id))
        .flatMap((activity) => activityTopicIds(workspace, activity)),
    ]),
  ];
}

export function attachmentTopicIds(workspace: Workspace, attachment: Attachment): string[] {
  return [
    ...new Set([
      ...attachment.topicIds,
      ...workspace.tasks
        .filter((task) => attachment.taskIds.includes(task.id))
        .map((task) => task.topicId),
      ...workspace.activities
        .filter((activity) => attachment.activityIds.includes(activity.id))
        .flatMap((activity) => activityTopicIds(workspace, activity)),
      ...workspace.sources
        .filter((source) => attachment.sourceIds.includes(source.id))
        .flatMap((source) => sourceTopicIds(workspace, source)),
    ]),
  ];
}
