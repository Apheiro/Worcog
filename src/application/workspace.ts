import type { Activity, Attachment, Base, Source, Task, Topic, Workspace } from '../domain/model';
import { applyWorkspaceChanges as changed } from './workspace-changes';
import { isDateOnly, occurrenceDate, today } from '../domain/dates';
type Input<T extends Base> = Partial<Omit<T, keyof Base>>;
const stamp = (now: string) => ({ id: crypto.randomUUID(), createdAt: now, updatedAt: now });
const clock = () => new Date().toISOString();
function requireItem<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((value) => value.id === id);
  if (!item) throw new Error('The selected item no longer exists.');
  return item;
}
function statusActivity(
  workspace: Workspace,
  topicIds: string[],
  taskIds: string[],
  title: string,
  previous: string,
  next: string,
  now: string,
): Activity[] {
  if (previous === next) return workspace.activities;
  return [
    ...workspace.activities,
    {
      ...stamp(now),
      text: `${title}: status changed from ${previous.replaceAll('_', ' ')} to ${next.replaceAll('_', ' ')}.`,
      kind: 'status',
      eventAt: now,
      topicIds,
      taskIds,
      sourceIds: [],
      revisions: [],
    },
  ];
}
export function createTopic(
  workspace: Workspace,
  input: Input<Topic> & Pick<Topic, 'title'>,
  now = clock(),
): Workspace {
  const topic: Topic = {
    summary: '',
    category: 'General',
    status: 'pending',
    priority: 'normal',
    owner: '',
    participants: '',
    tags: [],
    nextAction: '',
    targetDate: null,
    closedAt: null,
    archived: false,
    relatedTopicIds: [],
    ...input,
    ...stamp(now),
  };
  if (topic.status === 'completed' || topic.status === 'canceled') topic.closedAt = now;
  return changed(workspace, { topics: [...workspace.topics, topic] }, now);
}
export function updateTopic(
  workspace: Workspace,
  id: string,
  patch: Input<Topic>,
  now = clock(),
): Workspace {
  const previous = requireItem(workspace.topics, id);
  const topic = { ...previous, ...patch, id, createdAt: previous.createdAt, updatedAt: now };
  topic.closedAt =
    topic.status === 'completed' || topic.status === 'canceled' ? (previous.closedAt ?? now) : null;
  return changed(
    workspace,
    {
      topics: workspace.topics.map((value) => (value.id === id ? topic : value)),
      activities: statusActivity(
        workspace,
        [id],
        [],
        topic.title,
        previous.status,
        topic.status,
        now,
      ),
    },
    now,
  );
}
export function createTask(
  workspace: Workspace,
  input: Input<Task> & Pick<Task, 'title' | 'topicId'>,
  now = clock(),
): Workspace {
  const task: Task = {
    description: '',
    parentId: null,
    status: 'pending',
    priority: 'normal',
    owner: '',
    startDate: null,
    dueDate: null,
    completedAt: null,
    nextAction: '',
    tags: [],
    sourceIds: [],
    recurrence: 'none',
    recurrenceRootId: null,
    occurrenceDate: null,
    ...input,
    ...stamp(now),
  };
  task.completedAt = task.status === 'completed' ? now : null;
  return changed(workspace, { tasks: [...workspace.tasks, task] }, now);
}
export function updateTask(
  workspace: Workspace,
  id: string,
  patch: Input<Task>,
  now = clock(),
): Workspace {
  const previous = requireItem(workspace.tasks, id);
  if (
    ((patch.dueDate !== undefined && patch.dueDate !== previous.dueDate) ||
      (patch.recurrence !== undefined && patch.recurrence !== previous.recurrence)) &&
    workspace.tasks.some((task) => task.recurrenceRootId === id)
  )
    throw new Error(
      'This series already has occurrences. Create a new recurring task to change its schedule.',
    );
  const task = { ...previous, ...patch, id, createdAt: previous.createdAt, updatedAt: now };
  task.completedAt = task.status === 'completed' ? (previous.completedAt ?? now) : null;
  return changed(
    workspace,
    {
      tasks: workspace.tasks.map((value) => (value.id === id ? task : value)),
      activities: statusActivity(
        workspace,
        [task.topicId],
        [id],
        task.title,
        previous.status,
        task.status,
        now,
      ),
    },
    now,
  );
}
export function createSource(
  workspace: Workspace,
  input: Input<Source> & Pick<Source, 'title'>,
  now = clock(),
): Workspace {
  const source: Source = {
    kind: 'other',
    platform: '',
    identifier: '',
    url: '',
    eventAt: now,
    participants: '',
    notes: '',
    tags: [],
    topicIds: [],
    ...input,
    ...stamp(now),
  };
  return changed(workspace, { sources: [...workspace.sources, source] }, now);
}
export function updateSource(
  workspace: Workspace,
  id: string,
  patch: Input<Source>,
  now = clock(),
): Workspace {
  const previous = requireItem(workspace.sources, id);
  return changed(
    workspace,
    {
      sources: workspace.sources.map((value) =>
        value.id === id
          ? { ...previous, ...patch, id, createdAt: previous.createdAt, updatedAt: now }
          : value,
      ),
    },
    now,
  );
}
export function createActivity(
  workspace: Workspace,
  input: Input<Activity> & Pick<Activity, 'text'>,
  now = clock(),
): Workspace {
  const activity: Activity = {
    kind: 'note',
    eventAt: now,
    topicIds: [],
    taskIds: [],
    sourceIds: [],
    ...input,
    revisions: [],
    ...stamp(now),
  };
  return changed(workspace, { activities: [...workspace.activities, activity] }, now);
}
export function updateActivity(
  workspace: Workspace,
  id: string,
  patch: Omit<Input<Activity>, 'revisions'>,
  now = clock(),
): Workspace {
  const previous = requireItem(workspace.activities, id);
  const activity: Activity = {
    ...previous,
    ...patch,
    id,
    createdAt: previous.createdAt,
    updatedAt: now,
    revisions: [...previous.revisions, { text: previous.text, revisedAt: now }],
  };
  return changed(
    workspace,
    { activities: workspace.activities.map((value) => (value.id === id ? activity : value)) },
    now,
  );
}
export function addAttachment(
  workspace: Workspace,
  input: Omit<Attachment, 'id' | 'addedAt'> & Partial<Pick<Attachment, 'id' | 'addedAt'>>,
  now = clock(),
): Workspace {
  return changed(
    workspace,
    {
      attachments: [
        ...workspace.attachments,
        { ...input, id: input.id ?? crypto.randomUUID(), addedAt: input.addedAt ?? now },
      ],
    },
    now,
  );
}
export function updateAttachmentLinks(
  workspace: Workspace,
  id: string,
  patch: Partial<Pick<Attachment, 'topicIds' | 'taskIds' | 'sourceIds' | 'activityIds'>>,
  now = clock(),
): Workspace {
  const attachment = requireItem(workspace.attachments, id);
  return changed(
    workspace,
    {
      attachments: workspace.attachments.map((value) =>
        value.id === id ? { ...attachment, ...patch } : value,
      ),
    },
    now,
  );
}
/** Unlink only; the managed file and metadata remain available for later relinking. */
export function unlinkAttachment(
  workspace: Workspace,
  id: string,
  kind: 'topicIds' | 'taskIds' | 'sourceIds' | 'activityIds',
  entityId: string,
  now = clock(),
): Workspace {
  const file = requireItem(workspace.attachments, id);
  return updateAttachmentLinks(
    workspace,
    id,
    { [kind]: file[kind].filter((value) => value !== entityId) },
    now,
  );
}
export function linkTopics(
  workspace: Workspace,
  first: string,
  second: string,
  linked = true,
  now = clock(),
): Workspace {
  requireItem(workspace.topics, first);
  requireItem(workspace.topics, second);
  if (first === second) throw new Error('A topic cannot relate to itself.');
  return changed(
    workspace,
    {
      topics: workspace.topics.map((topic) => {
        if (topic.id !== first && topic.id !== second) return topic;
        const other = topic.id === first ? second : first;
        return {
          ...topic,
          updatedAt: now,
          relatedTopicIds: linked
            ? [...new Set([...topic.relatedTopicIds, other])]
            : topic.relatedTopicIds.filter((id) => id !== other),
        };
      }),
    },
    now,
  );
}
/** Generate at most 500 missing instances per series per invocation; repeated runs catch up safely. */
export function generateOccurrences(
  workspace: Workspace,
  through = today(),
  now = clock(),
): Workspace {
  if (!isDateOnly(through)) throw new Error('Invalid recurrence horizon.');
  const created: Task[] = [];
  for (const root of workspace.tasks) {
    if (
      root.recurrence === 'none' ||
      root.recurrenceRootId ||
      !root.dueDate ||
      root.status === 'canceled' ||
      workspace.topics.find((topic) => topic.id === root.topicId)?.archived
    )
      continue;
    const dates = new Set(
      workspace.tasks
        .filter((task) => task.recurrenceRootId === root.id)
        .map((task) => task.occurrenceDate),
    );
    let generated = 0;
    // Index starts at 1: the root itself represents the anchor occurrence.
    for (let index = 1; generated < 500; index++) {
      const dueDate = occurrenceDate(root.dueDate, root.recurrence, index);
      if (dueDate > through) break;
      if (dates.has(dueDate)) continue;
      created.push({
        ...root,
        ...stamp(now),
        status: 'pending',
        completedAt: null,
        startDate: null,
        dueDate,
        recurrence: 'none',
        recurrenceRootId: root.id,
        occurrenceDate: dueDate,
      });
      generated++;
    }
  }
  return created.length
    ? changed(workspace, { tasks: [...workspace.tasks, ...created] }, now)
    : workspace;
}
