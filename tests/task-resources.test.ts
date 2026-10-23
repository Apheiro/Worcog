import { expect, it } from 'vitest';
import { mergeResourceDrafts, saveTaskWithResources, type TaskResourcesDraft } from '../src/application/task-resources';
import { createTask, createTopic } from '../src/application/workspace';
import { emptyWorkspace, type Attachment } from '../src/domain/model';

it('keeps one attachment and its saved references when a committed draft is still present', () => {
  const topicWorkspace = createTopic(emptyWorkspace(), { title: 'Topic' });
  const topicId = topicWorkspace.topics[0].id;
  const initial = createTask(topicWorkspace, { title: 'Other task', topicId });
  const otherTaskId = initial.tasks[0].id;
  const file: Attachment = {
    id: crypto.randomUUID(),
    originalName: 'document.txt',
    managedName: 'document.txt',
    mime: 'text/plain',
    size: 10,
    addedAt: new Date().toISOString(),
    topicIds: [],
    taskIds: [],
    activityIds: [],
    sourceIds: [],
  };
  const draft: TaskResourcesDraft = {
    sourceIds: [], fileIds: [file.id], sources: [], files: [file],
  };
  const input = { title: 'Task with file', topicId };
  const saved = saveTaskWithResources(initial, undefined, input, draft, []);
  const taskId = saved.tasks[1].id;
  const currentFile = {
    ...saved.attachments[0],
    managedName: 'updated-document.txt',
    size: 20,
    topicIds: [topicId],
    taskIds: [taskId, otherTaskId],
  };
  const current = { ...saved, attachments: [currentFile] };

  expect(mergeResourceDrafts(current.attachments, draft.files)).toEqual([currentFile]);
  const retried = saveTaskWithResources(current, taskId, input, draft, []);
  expect(retried.attachments).toEqual([currentFile]);
  expect(retried.tasks).toHaveLength(2);
  expect(draft.files).toEqual([file]);
});
