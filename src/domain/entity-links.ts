import type { EntityLink, EntityRef, Workspace } from './model';

export const entityKey = (entity: EntityRef) => JSON.stringify([entity.kind, entity.id]);
export const sameEntity = (a: EntityRef | null, b: EntityRef | null) =>
  a !== null && b !== null && a.kind === b.kind && a.id === b.id;
export const linkKey = (link: EntityLink) => JSON.stringify([entityKey(link.from), entityKey(link.to)].sort());
export type EntityConnection = { target: EntityRef; direction: 'incoming' | 'outgoing' | 'related' };
export type ResolvedEntityLink = EntityLink & { directed: boolean };
export function resolveEntity(workspace: Workspace, ref: EntityRef) {
  return ref.kind === 'task' ? workspace.tasks.find((task) => task.id === ref.id)
    : workspace.topics.find((topic) => topic.id === ref.id);
}
/** Include legacy topic relationships without duplicating or discarding them. */
export function entityLinks(workspace: Workspace): ResolvedEntityLink[] {
  const links = new Map<string, ResolvedEntityLink>((workspace.links ?? []).map((link) => [linkKey(link), { ...link, directed: true }]));
  for (const topic of workspace.topics) {
    for (const id of topic.relatedTopicIds) {
      const link: EntityLink = { from: { kind: 'topic', id: topic.id }, to: { kind: 'topic', id } };
      // Legacy relatedTopicIds never recorded precedence. Do not invent it or
      // overwrite the recorded direction of a newer explicit connection.
      if (!links.has(linkKey(link))) links.set(linkKey(link), { ...link, directed: false });
    }
  }
  return [...links.values()];
}
export function relatedEntities(workspace: Workspace, ref: EntityRef): EntityRef[] {
  return entityLinks(workspace).flatMap((link) => sameEntity(link.from, ref) ? [link.to]
    : sameEntity(link.to, ref) ? [link.from] : []);
}
