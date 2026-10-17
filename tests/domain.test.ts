import { describe, expect, it } from 'vitest';
import { emptyWorkspace } from '../src/domain/model';
import { workspaceSchema } from '../src/domain/validation';
import { occurrenceDate } from '../src/domain/dates';
import {
  addAttachment,
  createActivity,
  createSource,
  createTask,
  createTopic,
  generateOccurrences,
  linkTopics,
  unlinkAttachment,
  updateActivity,
  updateSource,
  updateTask,
  updateTopic,
} from '../src/application/workspace';
import {
  filterTasks,
  filterTopics,
  searchWorkspace,
  topicTimeline,
} from '../src/application/queries';
const now = '2026-01-31T12:00:00.000Z';
function fixture() {
  return createTopic(emptyWorkspace(), { title: 'Incident', category: 'Operations' }, now);
}
describe('workspace use cases and validation', () => {
  it('creates immutable data and records status changes', () => {
    const initial = fixture();
    const id = initial.topics[0]!.id;
    const next = updateTopic(initial, id, { status: 'completed', summary: 'Resolved' }, now);
    expect(initial.topics[0]!.status).toBe('pending');
    expect(next.topics[0]!.closedAt).toBe(now);
    expect(next.activities[0]!.topicIds).toEqual([id]);
    expect(next.activities[0]!.text).toContain('pending to completed');
    expect(updateTopic(next, id, { status: 'pending' }, now).topics[0]!.closedAt).toBeNull();
  });
  it('rejects blank titles, orphan links, unsafe paths, invalid dates and unknown format versions', () => {
    expect(() => createTopic(emptyWorkspace(), { title: '  ' }, now)).toThrow();
    expect(() =>
      createTask(emptyWorkspace(), { title: 'Task', topicId: 'missing' }, now),
    ).toThrow();
    const workspace = fixture();
    expect(() =>
      createTask(
        workspace,
        { title: 'Task', topicId: workspace.topics[0]!.id, dueDate: '2026-02-30' },
        now,
      ),
    ).toThrow();
    expect(() =>
      addAttachment(
        workspace,
        {
          originalName: 'test',
          managedName: '../escape',
          size: 1,
          mime: '',
          topicIds: [],
          taskIds: [],
          activityIds: [],
          sourceIds: [],
        },
        now,
      ),
    ).toThrow();
    expect(workspaceSchema.safeParse({ ...workspace, formatVersion: 2 }).success).toBe(false);
  });
  it('preserves annotation revisions and event dates separately from creation dates', () => {
    let workspace = fixture();
    workspace = createActivity(
      workspace,
      {
        text: 'Initial decision',
        topicIds: [workspace.topics[0]!.id],
        eventAt: '2026-01-29T09:00:00.000Z',
      },
      now,
    );
    const activity = workspace.activities[0]!;
    workspace = updateActivity(
      workspace,
      activity.id,
      { text: 'Corrected decision' },
      '2026-02-01T12:00:00.000Z',
    );
    expect(workspace.activities[0]!.revisions).toEqual([
      { text: 'Initial decision', revisedAt: '2026-02-01T12:00:00.000Z' },
    ]);
    expect(workspace.activities[0]!.eventAt).toBe(activity.eventAt);
    expect(workspace.activities[0]!.createdAt).toBe(now);
  });
  it('supports shared sources, symmetric topic links and unlinking files without deletion', () => {
    let workspace = createTopic(fixture(), { title: 'Second' }, now);
    const [first, second] = workspace.topics;
    workspace = linkTopics(workspace, first!.id, second!.id, true, now);
    expect(workspace.topics[1]!.relatedTopicIds).toEqual([first!.id]);
    workspace = createSource(
      workspace,
      { title: 'Ticket', identifier: 'TEST-123', topicIds: [first!.id, second!.id] },
      now,
    );
    workspace = createActivity(
      workspace,
      { text: 'Decision', topicIds: [first!.id], sourceIds: [workspace.sources[0]!.id] },
      now,
    );
    workspace = addAttachment(
      workspace,
      {
        originalName: 'note.txt',
        managedName: 'test.txt',
        size: 2,
        mime: 'text/plain',
        topicIds: [first!.id],
        activityIds: [workspace.activities[0]!.id],
        sourceIds: [],
        taskIds: [],
      },
      now,
    );
    workspace = unlinkAttachment(workspace, workspace.attachments[0]!.id, 'topicIds', first!.id);
    expect(workspace.attachments).toHaveLength(1);
    expect(workspace.attachments[0]!.activityIds).toHaveLength(1);
    expect(workspace.sources).toHaveLength(1);
  });
  it('enforces same-topic subtasks, no hierarchy cycles and completion timestamps', () => {
    let workspace = fixture();
    const topicId = workspace.topics[0]!.id;
    workspace = createTask(workspace, { title: 'Parent', topicId }, now);
    const parentId = workspace.tasks[0]!.id;
    workspace = createTask(workspace, { title: 'Child', topicId, parentId }, now);
    expect(() =>
      updateTask(workspace, parentId, { parentId: workspace.tasks[1]!.id }, now),
    ).toThrow();
    workspace = updateTask(workspace, parentId, { status: 'completed' }, now);
    expect(workspace.tasks[0]!.completedAt).toBe(now);
    expect(workspace.activities[0]!.taskIds).toEqual([parentId]);
  });
});
describe('recurring real task instances', () => {
  it('clamps monthly dates from the anchor and respects leap years', () => {
    expect(occurrenceDate('2026-01-31', 'monthly', 1)).toBe('2026-02-28');
    expect(occurrenceDate('2026-01-31', 'monthly', 2)).toBe('2026-03-31');
    expect(occurrenceDate('2024-01-31', 'monthly', 1)).toBe('2024-02-29');
    expect(occurrenceDate('2026-12-31', 'daily', 1)).toBe('2027-01-01');
    expect(occurrenceDate('2026-12-31', 'weekly', 1)).toBe('2027-01-07');
  });
  it('generates unique instances through today even after root completion', () => {
    let workspace = fixture();
    workspace = createTask(
      workspace,
      {
        title: 'Monthly review',
        topicId: workspace.topics[0]!.id,
        recurrence: 'monthly',
        dueDate: '2026-01-31',
        status: 'completed',
      },
      now,
    );
    const root = workspace.tasks[0]!;
    workspace = generateOccurrences(workspace, '2026-03-31', now);
    expect(workspace.tasks.map((task) => task.dueDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
    expect(workspace.tasks[1]!.status).toBe('pending');
    expect(workspace.tasks[1]!.recurrenceRootId).toBe(root.id);
    expect(generateOccurrences(workspace, '2026-03-31', now)).toBe(workspace);
    expect(() => updateTask(workspace, root.id, { dueDate: '2026-02-01' }, now)).toThrow();
  });
  it('bounds catchup while allowing subsequent calls to finish without duplicates', () => {
    let workspace = fixture();
    workspace = createTask(
      workspace,
      {
        title: 'Daily',
        topicId: workspace.topics[0]!.id,
        recurrence: 'daily',
        dueDate: '2024-01-01',
      },
      now,
    );
    workspace = generateOccurrences(workspace, '2026-01-01', now);
    expect(workspace.tasks).toHaveLength(501);
    workspace = generateOccurrences(workspace, '2026-01-01', now);
    expect(workspace.tasks).toHaveLength(732);
    expect(generateOccurrences(workspace, '2026-01-01', now)).toBe(workspace);
  });
});
describe('real search, combined filters and chronology', () => {
  it('searches annotations and source identifiers and combines topic/task filters', () => {
    let workspace = fixture();
    const topicId = workspace.topics[0]!.id;
    workspace = createSource(
      workspace,
      { title: 'Vendor email', identifier: 'TICKET-241', platform: 'InvGate', topicIds: [topicId] },
      now,
    );
    workspace = createActivity(
      workspace,
      {
        text: 'Agreed a repair window',
        sourceIds: [workspace.sources[0]!.id],
        topicIds: [topicId],
      },
      now,
    );
    workspace = createTask(
      workspace,
      {
        title: 'Repair service',
        topicId,
        status: 'blocked',
        priority: 'high',
        dueDate: '2026-01-01',
      },
      now,
    );
    expect(
      searchWorkspace(workspace, 'ticket-241')
        .map((result) => result.type)
        .sort(),
    ).toEqual(['activity', 'source']);
    expect(searchWorkspace(workspace, { query: 'repair', type: 'activity' })).toHaveLength(1);
    expect(
      filterTasks(
        workspace,
        { status: 'blocked', priority: 'high', overdueOnly: true },
        '2026-01-02',
      ),
    ).toHaveLength(1);
    expect(filterTasks(workspace, { status: 'completed' })).toHaveLength(0);
    expect(filterTopics(workspace, { category: 'Operations', query: 'incident' })).toHaveLength(1);
  });
  it('orders timeline by event date rather than recording date and includes source-only entries', () => {
    let workspace = fixture();
    const topicId = workspace.topics[0]!.id;
    workspace = createActivity(
      workspace,
      { text: 'Newer event', topicIds: [topicId], eventAt: '2026-01-30T00:00:00.000Z' },
      now,
    );
    workspace = createActivity(
      workspace,
      { text: 'Older event', topicIds: [topicId], eventAt: '2026-01-01T00:00:00.000Z' },
      now,
    );
    workspace = createSource(
      workspace,
      { title: 'Original message', topicIds: [topicId], eventAt: '2025-12-01T00:00:00.000Z' },
      now,
    );
    expect(
      topicTimeline(workspace, topicId).map((entry) =>
        entry.title === 'Original message' ? entry.title : entry.text,
      ),
    ).toEqual(['Original message', 'Older event', 'Newer event']);
  });
});

it('orders offset timestamps by instant and rejects executable source links', () => {
  let workspace = fixture();
  const topicId = workspace.topics[0]!.id;
  workspace = createActivity(
    workspace,
    { text: 'Earlier instant', topicIds: [topicId], eventAt: '2026-01-01T09:00:00+03:00' },
    now,
  );
  workspace = createActivity(
    workspace,
    { text: 'Later instant', topicIds: [topicId], eventAt: '2026-01-01T08:00:00Z' },
    now,
  );
  expect(topicTimeline(workspace, topicId).map((entry) => entry.text)).toEqual([
    'Earlier instant',
    'Later instant',
  ]);
  expect(() =>
    createSource(workspace, { title: 'Unsafe', url: 'javascript:alert(1)' }, now),
  ).toThrow();
  expect(() => createSource(workspace, { title: 'Invalid', url: 'http:' }, now)).toThrow();
});

describe('topic freshness follows related work', () => {
  const later = '2026-02-01T10:00:00.000Z';
  const latest = '2026-02-02T10:00:00.000Z';
  it('touches linked topics for task, annotation, source and attachment changes', () => {
    let workspace = createTopic(fixture(), { title: 'Unchanged' }, now);
    const topicId = workspace.topics[0]!.id;
    workspace = createTask(workspace, { title: 'Action', topicId }, later);
    expect(workspace.topics.map((topic) => topic.updatedAt)).toEqual([later, now]);
    workspace = createActivity(
      workspace,
      { text: 'Task note', taskIds: [workspace.tasks[0]!.id], eventAt: '2025-01-01T00:00:00.000Z' },
      latest,
    );
    expect(workspace.topics[0]!.updatedAt).toBe(latest);
    expect(workspace.activities[0]!.eventAt).toBe('2025-01-01T00:00:00.000Z');
    workspace = createSource(
      workspace,
      { title: 'Reference', topicIds: [topicId] },
      '2026-02-03T10:00:00.000Z',
    );
    expect(workspace.topics[0]!.updatedAt).toBe('2026-02-03T10:00:00.000Z');
    workspace = addAttachment(
      workspace,
      {
        originalName: 'note.txt',
        managedName: 'note.txt',
        size: 1,
        mime: 'text/plain',
        taskIds: [],
        sourceIds: [],
        topicIds: [],
        activityIds: [workspace.activities[0]!.id],
      },
      '2026-02-04T10:00:00.000Z',
    );
    expect(workspace.topics[0]!.updatedAt).toBe('2026-02-04T10:00:00.000Z');
    expect(workspace.topics[1]!.updatedAt).toBe(now);
    workspace = unlinkAttachment(
      workspace,
      workspace.attachments[0]!.id,
      'activityIds',
      workspace.activities[0]!.id,
      '2026-02-05T10:00:00.000Z',
    );
    expect(workspace.topics[0]!.updatedAt).toBe('2026-02-05T10:00:00.000Z');
  });
  it('includes task-linked sources in timelines and search without a direct topic link', () => {
    let workspace = fixture();
    const topicId = workspace.topics[0]!.id;
    workspace = createSource(workspace, { title: 'Task origin', identifier: 'TASK-REF' }, now);
    const sourceId = workspace.sources[0]!.id;
    workspace = createTask(workspace, { title: 'Action', topicId, sourceIds: [sourceId] }, later);
    expect(
      topicTimeline(workspace, topicId)
        .filter((entry) => entry.type === 'source')
        .map((entry) => entry.id),
    ).toEqual([sourceId]);
    expect(searchWorkspace(workspace, { query: 'TASK-REF', topicId })).toHaveLength(1);
    workspace = updateSource(workspace, sourceId, { notes: 'Clarified origin' }, latest);
    expect(workspace.topics[0]!.updatedAt).toBe(latest);
  });
});

it('filters timestamp dates by the displayed day while keeping date-only deadlines unchanged', () => {
  let w = fixture();
  w = createSource(
    w,
    { title: 'Offset reference', eventAt: '2026-01-02T00:30:00+14:00', topicIds: [w.topics[0].id] },
    now,
  );
  w = createTask(
    w,
    { title: 'Calendar deadline', topicId: w.topics[0].id, dueDate: '2026-01-02' },
    now,
  );
  expect(searchWorkspace(w, { type: 'source', from: '2026-01-01', to: '2026-01-01' })).toHaveLength(
    1,
  );
  expect(searchWorkspace(w, { type: 'source', from: '2026-01-02' })).toHaveLength(0);
  expect(filterTasks(w, { from: '2026-01-02', to: '2026-01-02' })).toHaveLength(1);
});
