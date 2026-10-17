import { describe, expect, it } from 'vitest';
import { orderTasksForDisplay } from '../src/application/task-order';
import { filterTasks } from '../src/application/queries';
import { createTask, createTopic } from '../src/application/workspace';
import { emptyWorkspace, type Task } from '../src/domain/model';
const now = '2026-10-17T12:00:00.000Z';
const topicWorkspace = createTopic(emptyWorkspace(), { title: 'Topic' }, now);
const workspace = createTask(
  topicWorkspace,
  {
    title: 'Template',
    topicId: topicWorkspace.topics[0].id,
  },
  now,
);
const task = (id: string, parentId: string | null = null, dueDate: string | null = null): Task => ({
  ...workspace.tasks[0],
  id,
  title: id,
  parentId,
  dueDate,
});
const ids = (tasks: readonly Task[]) => tasks.map((value) => value.id);

describe('task display hierarchy', () => {
  it('keeps a child after its parent even when due-date sorting puts it first', () => {
    const w = { ...workspace, tasks: [task('Parent'), task('Child', 'Parent', '2026-01-01')] };
    const byDueDate = filterTasks(w);
    expect(ids(byDueDate)).toEqual(['Child', 'Parent']);
    expect(ids(orderTasksForDisplay(byDueDate))).toEqual(['Parent', 'Child']);
  });
  it('groups descendants beneath each parent and preserves root and sibling order without mutation', () => {
    const incoming = Object.freeze([
      task('child-2', 'parent'),
      task('other-root'),
      task('grandchild', 'child-2'),
      task('parent'),
      task('child-1', 'parent'),
    ]);
    const before = ids(incoming);
    expect(ids(orderTasksForDisplay(incoming))).toEqual([
      'other-root',
      'parent',
      'child-2',
      'grandchild',
      'child-1',
    ]);
    expect(ids(incoming)).toEqual(before);
  });
  it('keeps filtered children visible without restoring ancestors excluded by the filter', () => {
    expect(
      ids(orderTasksForDisplay([task('grandchild', 'child'), task('child', 'hidden-parent')])),
    ).toEqual(['child', 'grandchild']);
  });
  it('handles empty lists and defensively retains rows in invalid cyclic input', () => {
    expect(orderTasksForDisplay([])).toEqual([]);
    expect(ids(orderTasksForDisplay([task('a', 'b'), task('b', 'a')]))).toEqual(['a', 'b']);
  });
});
