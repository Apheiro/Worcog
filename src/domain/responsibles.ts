import type { Task, Topic, Workspace } from './model';

export const assignedNames = (item: Pick<Task | Topic, 'owner' | 'responsibleNames'>): string[] =>
  item.responsibleNames ?? (item.owner.trim() ? [item.owner.trim()] : []);

export const responsibleKey = (name: string) => name.trim().toLocaleLowerCase();

export function withoutResponsibles(names: string[], removed: string[]): string[] {
  const keys = new Set(removed.map(responsibleKey));
  return names.filter((name) => !keys.has(responsibleKey(name)));
}

export function responsibleDirectory(w: Workspace): string[] {
  const names = [
    ...(w.responsibleNames ?? []),
    ...w.tasks.flatMap(assignedNames),
    ...w.topics.flatMap(assignedNames),
    ...w.topics.map((topic) => topic.requesterName ?? '').filter(Boolean),
    ...(w.contacts ?? []).map((contact) => contact.name),
  ];
  return [...new Map(names.map((name) => [responsibleKey(name), name])).values()].sort((a, b) =>
    a.localeCompare(b),
  );
}
