import type { EntityRef, Workspace } from '../domain/model';
import { entityLinks, linkKey, resolveEntity, sameEntity } from '../domain/entity-links';
import { applyWorkspaceChanges } from './workspace-changes';

export function connectEntities(workspace: Workspace, from: EntityRef, to: EntityRef): Workspace {
  if (!resolveEntity(workspace, from) || !resolveEntity(workspace, to))
    throw new Error('One of the selected items no longer exists.');
  if (sameEntity(from, to)) throw new Error('An item cannot link to itself.');
  const link = { from, to };
  if (entityLinks(workspace).some((existing) => linkKey(existing) === linkKey(link)))
    throw new Error('These items are already linked.');
  return applyWorkspaceChanges(workspace, { links: [...(workspace.links ?? []), link] }, new Date().toISOString());
}

export function disconnectEntities(workspace: Workspace, from: EntityRef, to: EntityRef): Workspace {
  const key = linkKey({ from, to });
  return applyWorkspaceChanges(workspace, {
    links: (workspace.links ?? []).filter((link) => linkKey(link) !== key),
    topics: from.kind === 'topic' && to.kind === 'topic' ? workspace.topics.map((topic) => {
      const other = topic.id === from.id ? to.id : topic.id === to.id ? from.id : null;
      return other && topic.relatedTopicIds.includes(other)
        ? { ...topic, relatedTopicIds: topic.relatedTopicIds.filter((id) => id !== other) }
        : topic;
    }) : workspace.topics,
  }, new Date().toISOString());
}
