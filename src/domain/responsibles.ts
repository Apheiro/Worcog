import type { Task, Topic, Workspace } from './model';

export const assignedNames = (item: Pick<Task | Topic, 'owner' | 'responsibleNames'>): string[] =>
  item.responsibleNames ?? (item.owner.trim() ? [item.owner.trim()] : []);

export function responsibleDirectory(w: Workspace): string[] {
  const names = [
    ...(w.responsibleNames ?? []),
    ...w.tasks.flatMap(assignedNames),
    ...w.topics.flatMap(assignedNames),
  ];
  return [...new Map(names.map((name) => [name.toLocaleLowerCase(), name])).values()].sort((a, b) =>
    a.localeCompare(b),
  );
}
