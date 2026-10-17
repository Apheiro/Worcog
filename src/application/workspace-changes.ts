import type { Workspace } from '../domain/model';
import { workspaceSchema } from '../domain/validation';
import { activityTopicIds, attachmentTopicIds, sourceTopicIds } from '../domain/relationships';

export function applyWorkspaceChanges(
  workspace: Workspace,
  patch: Partial<Workspace>,
  now: string,
): Workspace {
  const next = { ...workspace, ...patch };
  const affected = new Set<string>();
  function collect<T extends { id: string }>(
    before: T[],
    after: T[],
    topics: (state: Workspace, item: T) => string[],
  ) {
    const previous = new Map(before.map((item) => [item.id, item]));
    const remaining = new Set(after.map((item) => item.id));
    for (const old of before) {
      if (!remaining.has(old.id)) for (const id of topics(workspace, old)) affected.add(id);
    }
    for (const item of after) {
      const old = previous.get(item.id);
      if (old === item) continue;
      for (const id of topics(next, item)) affected.add(id);
      if (old) for (const id of topics(workspace, old)) affected.add(id);
    }
  }
  if (patch.tasks) collect(workspace.tasks, patch.tasks, (_state, task) => [task.topicId]);
  if (patch.activities) collect(workspace.activities, patch.activities, activityTopicIds);
  if (patch.sources) collect(workspace.sources, patch.sources, sourceTopicIds);
  if (patch.attachments) collect(workspace.attachments, patch.attachments, attachmentTopicIds);
  const topics = next.topics.map((topic) =>
    affected.has(topic.id) ? { ...topic, updatedAt: now } : topic,
  );
  return workspaceSchema.parse({ ...next, topics, revision: workspace.revision + 1 });
}
