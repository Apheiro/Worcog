import { describe, expect, it } from 'vitest';
import { deleteEntity, deletionPreview } from '../src/application/deletion';
import { emptyWorkspace, type Workspace } from '../src/domain/model';
import { workspaceSchema } from '../src/domain/validation';
import {
  addAttachment,
  createActivity,
  createSource,
  createTask,
  createTopic,
  updateActivity,
  updateTopic,
} from '../src/application/workspace';
const now = '2026-01-01T12:00:00.000Z';
const later = '2026-02-01T12:00:00.000Z';
function fixture() {
  let w = createTopic(emptyWorkspace(), { title: 'Delete topic' }, now);
  w = createTopic(w, { title: 'Keep topic' }, now);
  w = createTopic(w, { title: 'Unrelated topic' }, now);
  const [a, b] = w.topics.map((t) => t.id);
  w = updateTopic(w, b, { relatedTopicIds: [a] }, now);
  w = createTask(w, { title: 'Delete task', topicId: a }, now);
  w = createTask(w, { title: 'Keep task', topicId: b }, now);
  w = createSource(w, { title: 'Exclusive source', topicIds: [a] }, now);
  w = createSource(w, { title: 'Shared source', topicIds: [a, b] }, now);
  w = createActivity(
    w,
    { text: 'Exclusive annotation', topicIds: [a], sourceIds: [w.sources[0].id] },
    now,
  );
  w = updateActivity(w, w.activities[0].id, { text: 'Corrected annotation' }, later);
  w = createActivity(w, { text: 'Shared annotation', topicIds: [a, b] }, now);
  return w;
}
function file(w: Workspace, id: string, links: Partial<Workspace['attachments'][number]>) {
  return addAttachment(
    w,
    {
      id,
      originalName: id + '.txt',
      managedName: id + '.txt',
      size: 4,
      mime: 'text/plain',
      topicIds: [],
      taskIds: [],
      activityIds: [],
      sourceIds: [],
      ...links,
    },
    now,
  );
}
describe('permanent entity deletion', () => {
  it('cascades topic-owned data and preserves shared data, without mutating input or creating history', () => {
    let w = fixture();
    const [a, b, c] = w.topics.map((t) => t.id);
    w = file(w, 'exclusive', { taskIds: [w.tasks[0].id] });
    w = file(w, 'shared', { topicIds: [a, b], sourceIds: [w.sources[0].id] });
    w = file(w, 'annotation', { activityIds: [w.activities[0].id] });
    const before = structuredClone(w);
    const preview = deletionPreview(w, { kind: 'topic', id: a });
    expect(preview.counts).toEqual({ topics: 1, tasks: 1, annotations: 1, sources: 1, files: 2 });
    const result = deleteEntity(w, { kind: 'topic', id: a }, later);
    expect(w).toEqual(before);
    expect(result.tasks.map((t) => t.title)).toEqual(['Keep task']);
    expect(result.sources.map((s) => s.title)).toEqual(['Shared source']);
    expect(result.sources[0].topicIds).toEqual([b]);
    expect(result.activities.map((a) => a.text)).toEqual(['Shared annotation']);
    expect(result.activities[0].topicIds).toEqual([b]);
    expect(result.attachments.map((f) => f.id)).toEqual(['shared']);
    expect(result.attachments[0].sourceIds).toEqual([]);
    expect(result.attachments[0].topicIds).toEqual([b]);
    expect(result.topics.find((t) => t.id === b)?.relatedTopicIds).toEqual([]);
    expect(result.topics.find((t) => t.id === c)?.updatedAt).toBe(now);
    expect(workspaceSchema.safeParse(result).success).toBe(true);
  });
  it('removes a source and exclusive files while retaining task and annotation contents', () => {
    let w = fixture();
    const id = w.sources[0].id;
    w = file(w, 'exclusive', { sourceIds: [id] });
    w = file(w, 'shared', { sourceIds: [id, w.sources[1].id] });
    const result = deleteEntity(w, { kind: 'source', id }, later);
    expect(result.tasks).toEqual(w.tasks);
    expect(result.activities[0].text).toBe(w.activities[0].text);
    expect(result.activities[0].revisions).toEqual(w.activities[0].revisions);
    expect(result.activities[0].sourceIds).toEqual([]);
    expect(result.attachments.map((f) => f.id)).toEqual(['shared']);
    expect(result.attachments[0].sourceIds).toEqual([w.sources[1].id]);
    expect(workspaceSchema.safeParse(result).success).toBe(true);
  });
  it('removes annotation revisions and exclusive files, retaining other linked files', () => {
    let w = fixture();
    const id = w.activities[0].id;
    w = file(w, 'exclusive', { activityIds: [id] });
    w = file(w, 'shared', { activityIds: [id, w.activities[1].id] });
    const result = deleteEntity(w, { kind: 'activity', id }, later);
    expect(result.activities).toHaveLength(1);
    expect(result.attachments.map((f) => f.id)).toEqual(['shared']);
    expect(result.attachments[0].activityIds).toEqual([w.activities[1].id]);
    expect(result.sources).toEqual(w.sources);
  });
  it('explicit file deletion removes all file references without deleting related entities', () => {
    const w = file(fixture(), 'file', { topicIds: [], sourceIds: [] });
    const result = deleteEntity(w, { kind: 'attachment', id: 'file' }, later);
    expect(result.attachments).toEqual([]);
    expect(result.topics).toEqual(w.topics);
    expect(result.tasks).toEqual(w.tasks);
    expect(result.activities).toEqual(w.activities);
    expect(result.sources).toEqual(w.sources);
  });
  it('clears every collection, including unrelated records, without an audit event', () => {
    const w = file(fixture(), 'file', {});
    expect(deleteEntity(w, { kind: 'workspace' }, later)).toEqual({
      ...emptyWorkspace(),
      revision: w.revision + 1,
    });
  });
  it.each(['topic', 'source', 'activity', 'attachment'] as const)('rejects missing %s', (kind) => {
    const w = fixture();
    const before = structuredClone(w);
    expect(() => deleteEntity(w, { kind, id: 'missing' }, later)).toThrow('no longer exists');
    expect(w).toEqual(before);
  });
});
