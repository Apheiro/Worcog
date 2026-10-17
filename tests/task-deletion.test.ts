import { describe, expect, it } from 'vitest';
import { deleteTask, planTaskDeletion } from '../src/application/task-deletion';
import { searchWorkspace, topicTimeline } from '../src/application/queries';
import { workspaceSchema } from '../src/domain/validation';
import { emptyWorkspace } from '../src/domain/model';
import {
  addAttachment,
  createActivity,
  createSource,
  createTask,
  createTopic,
  generateOccurrences,
  updateActivity,
  updateTask,
} from '../src/application/workspace';
const now = '2026-01-31T12:00:00.000Z';
const later = '2026-02-05T12:00:00.000Z';
const initial = () => createTopic(emptyWorkspace(), { title: 'Incident' }, now);

describe('permanent task deletion', () => {
  it('removes descendants, status history, annotation revisions and file links without a deletion event', () => {
    let w = initial();
    const topicId = w.topics[0].id;
    w = createSource(w, { title: 'Reusable source', topicIds: [topicId] }, now);
    w = createTask(w, { title: 'Test parent', topicId, sourceIds: [w.sources[0].id] }, now);
    const parent = w.tasks[0].id;
    w = createTask(w, { title: 'Test child', topicId, parentId: parent }, now);
    w = createTask(w, { title: 'Test grandchild', topicId, parentId: w.tasks[1].id }, now);
    w = createTask(w, { title: 'Keep task', topicId }, now);
    w = updateTask(w, parent, { status: 'completed' }, now);
    w = createActivity(
      w,
      { text: 'Test draft', topicIds: [topicId], taskIds: [parent], sourceIds: [w.sources[0].id] },
      now,
    );
    const activityId = w.activities.at(-1)!.id;
    w = updateActivity(w, activityId, { text: 'Test correction' }, later);
    w = createActivity(w, { text: 'Keep note', topicIds: [topicId] }, now);
    w = addAttachment(
      w,
      {
        id: 'file',
        managedName: 'fixture.txt',
        originalName: 'fixture.txt',
        mime: 'text/plain',
        size: 4,
        topicIds: [topicId],
        taskIds: [parent, w.tasks[3].id],
        activityIds: [activityId, w.activities.at(-1)!.id],
        sourceIds: [w.sources[0].id],
      },
      now,
    );
    const before = structuredClone(w);
    const result = deleteTask(w, parent, later);
    expect(w).toEqual(before);
    expect(result.tasks.map((task) => task.title)).toEqual(['Keep task']);
    expect(result.activities.map((activity) => activity.text)).toEqual(['Keep note']);
    expect(result.attachments[0].taskIds).toEqual([w.tasks[3].id]);
    expect(result.attachments[0].activityIds).toEqual([w.activities.at(-1)!.id]);
    expect(result.attachments[0].managedName).toBe('fixture.txt');
    expect(result.sources).toEqual(w.sources);
    expect(result.topics[0].updatedAt).toBe(later);
    expect(searchWorkspace(result, 'Test')).toHaveLength(0);
    expect(topicTimeline(result, topicId).some((entry) => entry.text.includes('Test'))).toBe(false);
    expect(workspaceSchema.safeParse(result).success).toBe(true);
    expect(result.revision).toBe(w.revision + 1);
  });
  it('deletes a normal child without deleting its parent or siblings', () => {
    let w = initial();
    const topicId = w.topics[0].id;
    w = createTask(w, { title: 'Parent', topicId }, now);
    const parent = w.tasks[0].id;
    w = createTask(w, { title: 'Child', topicId, parentId: parent }, now);
    const child = w.tasks[1].id;
    w = createTask(w, { title: 'Sibling', topicId, parentId: parent }, now);
    expect(deleteTask(w, child, later).tasks.map((task) => task.title)).toEqual([
      'Parent',
      'Sibling',
    ]);
  });
  it.each(['root', 'instance'])(
    'removes the whole recurring family when deleting a %s, without tombstones or regenerated occurrences',
    (kind) => {
      let w = initial();
      const topicId = w.topics[0].id;
      w = createTask(
        w,
        { title: 'Monthly test', topicId, dueDate: '2026-01-31', recurrence: 'monthly' },
        now,
      );
      const root = w.tasks[0].id;
      w = generateOccurrences(w, '2026-03-31', later);
      w = createTask(w, { title: 'Instance subtask', topicId, parentId: w.tasks[1].id }, now);
      w = createTask(w, { title: 'Unrelated', topicId }, now);
      const id = kind === 'root' ? root : w.tasks[1].id;
      expect(planTaskDeletion(w, id).taskIds).toHaveLength(4);
      expect(planTaskDeletion(w, id).includesRecurrence).toBe(true);
      const result = generateOccurrences(deleteTask(w, id, later), '2026-12-31', later);
      expect(result.tasks.map((task) => task.title)).toEqual(['Unrelated']);
      expect(result.activities).toEqual([]);
      expect(workspaceSchema.safeParse(result).success).toBe(true);
    },
  );
  it('counts shared annotations explicitly and removes them in full while retaining unrelated history', () => {
    let w = initial();
    const topicId = w.topics[0].id;
    w = createTopic(w, { title: 'Other topic' }, now);
    const other = w.topics[1].id;
    w = createTask(w, { title: 'Delete', topicId }, now);
    const id = w.tasks[0].id;
    w = createTask(w, { title: 'Keep', topicId: other }, now);
    w = createActivity(
      w,
      { text: 'Shared fact', taskIds: [id, w.tasks[1].id], topicIds: [topicId, other] },
      now,
    );
    w = createActivity(
      w,
      { text: 'Independent fact', taskIds: [w.tasks[1].id], topicIds: [other] },
      now,
    );
    expect(planTaskDeletion(w, id).sharedActivityCount).toBe(1);
    const result = deleteTask(w, id, later);
    expect(result.activities.map((activity) => activity.text)).toEqual(['Independent fact']);
    expect(result.topics.every((topic) => topic.updatedAt === later)).toBe(true);
  });
  it('rejects an absent task without changing the workspace', () => {
    const w = initial();
    const before = structuredClone(w);
    expect(() => deleteTask(w, 'missing', later)).toThrow('no longer exists');
    expect(w).toEqual(before);
  });
});
