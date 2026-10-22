import type { Attachment, Source, Task, Workspace } from '../domain/model';
import { responsibleDirectory } from '../domain/responsibles';
import type { SourcePlatform } from '../domain/sources';
import { createTask, deleteSourcePlatforms, updateTask } from './workspace';
import { applyWorkspaceChanges } from './workspace-changes';

export interface TaskResourcesDraft {
  sourceIds: string[];
  fileIds: string[];
  sources: Source[];
  files: Attachment[];
  removedSourcePlatforms?: SourcePlatform[];
}

/** Commit a task and its resource relationships together in the existing workspace transaction. */
export function saveTaskWithResources(
  w: Workspace,
  id: string | undefined,
  input: Partial<Task> & Pick<Task, 'title' | 'topicId'>,
  draft: TaskResourcesDraft,
  newResponsibleNames: string[],
): Workspace {
  if (!w.topics.some((topic) => topic.id === input.topicId))
    throw new Error('Create a task from its topic.');
  w = deleteSourcePlatforms(w, draft.removedSourcePlatforms ?? []);
  const sourceIds = new Map<string, string>();
  const sources = [...w.sources];
  for (const source of draft.sources.filter((s) => draft.sourceIds.includes(s.id))) {
    const existing = sources.find(
      (s) =>
        (source.url && s.url === source.url) ||
        (source.identifier &&
          s.identifier.toLocaleLowerCase() === source.identifier.toLocaleLowerCase() &&
          s.platform.toLocaleLowerCase() === source.platform.toLocaleLowerCase()),
    );
    sourceIds.set(source.id, existing?.id ?? source.id);
    if (!existing) sources.push(source);
  }
  const responsibleNames = [
    ...new Map(
      [...responsibleDirectory(w), ...newResponsibleNames, ...(input.responsibleNames ?? [])].map(
        (name) => [name.toLocaleLowerCase(), name],
      ),
    ).values(),
  ];
  const base = { ...w, sources, responsibleNames };
  const values = {
    ...input,
    sourceIds: [...new Set(draft.sourceIds.map((sourceId) => sourceIds.get(sourceId) ?? sourceId))],
  };
  const next = id ? updateTask(base, id, values) : createTask(base, values);
  const taskId = id ?? next.tasks[next.tasks.length - 1].id;
  const attachments = [
    ...next.attachments,
    ...draft.files.filter((file) => draft.fileIds.includes(file.id)),
  ].map((file) => {
    const linked = file.taskIds.includes(taskId);
    const selected = draft.fileIds.includes(file.id);
    if (linked === selected) return file;
    return {
      ...file,
      taskIds: selected
        ? [...file.taskIds, taskId]
        : file.taskIds.filter((value) => value !== taskId),
    };
  });
  return applyWorkspaceChanges(next, { attachments }, new Date().toISOString());
}
