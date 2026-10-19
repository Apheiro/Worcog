import type {
  ActivityKind,
  Priority,
  SourceKind,
  Status,
  Task,
  Topic,
  Workspace,
} from '../domain/model';
import { sourceType, sourceKindLabel } from '../domain/sources';
import { assignedNames } from '../domain/responsibles';
import { activityTopicIds, sourceTopicIds } from '../domain/relationships';
import { calendarDate, compareTimestamps, isOpen, isOverdue, today } from '../domain/dates';
export type EntityType = 'topic' | 'task' | 'activity' | 'source';
export interface SearchFilter {
  query?: string;
  type?: EntityType | '';
  category?: string;
  status?: Status | '';
  priority?: Priority | '';
  owner?: string;
  responsibleName?: string;
  from?: string;
  to?: string;
  topicId?: string;
  sourceKind?: SourceKind | '';
}
export interface SearchResult {
  id: string;
  type: EntityType;
  title: string;
  text: string;
  date: string;
  topicIds: string[];
}
const contains = (text: string, query = '') =>
  text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
const dateWithin = (date: string | null, filter: Pick<SearchFilter, 'from' | 'to'>) =>
  (!filter.from && !filter.to) ||
  (!!date &&
    (!filter.from || calendarDate(date) >= filter.from) &&
    (!filter.to || calendarDate(date) <= filter.to));
function matchesTopic(topic: Topic, filter: SearchFilter): boolean {
  return (
    (!filter.category || topic.category === filter.category) &&
    (!filter.status || topic.status === filter.status) &&
    (!filter.priority || topic.priority === filter.priority) &&
    (!(filter.responsibleName || filter.owner) ||
      contains(assignedNames(topic).join(' '), filter.responsibleName || filter.owner))
  );
}
export function filterTopics(
  workspace: Workspace,
  filter: SearchFilter = {},
  sort: 'updated' | 'due' | 'priority' | 'name' = 'updated',
  archived = false,
): Topic[] {
  const rank: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return workspace.topics
    .filter(
      (topic) =>
        topic.archived === archived &&
        matchesTopic(topic, filter) &&
        (!filter.topicId || filter.topicId === topic.id) &&
        contains(
          [topic.title, topic.summary, topic.category, ...assignedNames(topic)].join(' '),
          filter.query,
        ) &&
        dateWithin(topic.targetDate, filter),
    )
    .sort(
      (a, b) =>
        (sort === 'name'
          ? a.title.localeCompare(b.title)
          : sort === 'priority'
            ? rank[a.priority] - rank[b.priority]
            : sort === 'due'
              ? (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999')
              : compareTimestamps(b.updatedAt, a.updatedAt)) || a.id.localeCompare(b.id),
    );
}
export function filterTasks(
  workspace: Workspace,
  filter: SearchFilter & { openOnly?: boolean; overdueOnly?: boolean } = {},
  date = today(),
): Task[] {
  return workspace.tasks
    .filter(
      (task) =>
        (!filter.openOnly || isOpen(task.status)) &&
        (!filter.overdueOnly || isOverdue(task, date)) &&
        (!filter.topicId || task.topicId === filter.topicId) &&
        (!filter.category ||
          workspace.topics.find((topic) => topic.id === task.topicId)?.category ===
            filter.category) &&
        (!filter.status || task.status === filter.status) &&
        (!filter.priority || task.priority === filter.priority) &&
        (!(filter.responsibleName || filter.owner) ||
          contains(assignedNames(task).join(' '), filter.responsibleName || filter.owner)) &&
        dateWithin(task.dueDate, filter) &&
        contains([task.title, task.description, ...assignedNames(task)].join(' '), filter.query),
    )
    .sort(
      (a, b) =>
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    );
}
export function searchWorkspace(
  workspace: Workspace,
  filter: SearchFilter | string = {},
): SearchResult[] {
  const options = typeof filter === 'string' ? { query: filter } : filter;
  const results: SearchResult[] = [];
  const related = (ids: string[]) =>
    (!options.topicId || ids.includes(options.topicId)) &&
    (!options.category ||
      ids.some(
        (id) => workspace.topics.find((topic) => topic.id === id)?.category === options.category,
      ));
  const add = (result: SearchResult, body: string) => {
    if (
      (!options.type || result.type === options.type) &&
      related(result.topicIds) &&
      dateWithin(result.date, options) &&
      contains(body, options.query)
    )
      results.push(result);
  };
  for (const topic of workspace.topics)
    if (matchesTopic(topic, options))
      add(
        {
          id: topic.id,
          type: 'topic',
          title: topic.title,
          text: topic.summary,
          date: topic.updatedAt,
          topicIds: [topic.id],
        },
        [topic.title, topic.summary, topic.category, ...assignedNames(topic)].join(' '),
      );
  for (const task of workspace.tasks)
    if (
      (!options.status || task.status === options.status) &&
      (!options.priority || task.priority === options.priority) &&
      (!(options.responsibleName || options.owner) ||
        contains(assignedNames(task).join(' '), options.responsibleName || options.owner))
    )
      add(
        {
          id: task.id,
          type: 'task',
          title: task.title,
          text: task.description,
          date: task.dueDate ?? task.updatedAt,
          topicIds: [task.topicId],
        },
        [task.title, task.description, ...assignedNames(task)].join(' '),
      );
  if (!options.status && !options.priority && !options.owner && !options.responsibleName) {
    for (const activity of workspace.activities)
      add(
        {
          id: activity.id,
          type: 'activity',
          title: activity.kind.replaceAll('_', ' '),
          text: activity.text,
          date: activity.eventAt,
          topicIds: activityTopicIds(workspace, activity),
        },
        [
          activity.text,
          activity.kind,
          ...activity.sourceIds.map((id) => {
            const source = workspace.sources.find((item) => item.id === id);
            return source ? `${source.title} ${source.identifier}` : '';
          }),
        ].join(' '),
      );
    for (const source of workspace.sources)
      if (!options.sourceKind || (sourceType(source.kind) ?? source.kind) === options.sourceKind)
        add(
          {
            id: source.id,
            type: 'source',
            title: source.title,
            text: source.notes,
            date: source.eventAt,
            topicIds: sourceTopicIds(workspace, source),
          },
          [
            source.title,
            source.subject ?? '',
            sourceKindLabel(source.kind),
            source.platform,
            source.identifier,
            source.url,
            source.notes,
            source.participants,
          ].join(' '),
        );
  }
  return results.sort(
    (a, b) =>
      compareTimestamps(b.date, a.date) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id),
  );
}
export interface TimelineEntry {
  id: string;
  type: 'activity' | 'source';
  eventAt: string;
  createdAt: string;
  title: string;
  text: string;
  sourceIds: string[];
}
export function topicTimeline(
  workspace: Workspace,
  topicId: string,
  filter: { kind?: ActivityKind | ''; sourceId?: string } = {},
): TimelineEntry[] {
  const taskIds = new Set(
    workspace.tasks.filter((task) => task.topicId === topicId).map((task) => task.id),
  );
  const activities = workspace.activities.filter(
    (activity) =>
      (activity.topicIds.includes(topicId) || activity.taskIds.some((id) => taskIds.has(id))) &&
      (!filter.kind || activity.kind === filter.kind) &&
      (!filter.sourceId || activity.sourceIds.includes(filter.sourceId)),
  );
  const sources = workspace.sources.filter(
    (source) =>
      sourceTopicIds(workspace, source).includes(topicId) &&
      !filter.kind &&
      (!filter.sourceId || source.id === filter.sourceId),
  );
  return [
    ...activities.map((activity) => ({
      id: activity.id,
      type: 'activity' as const,
      eventAt: activity.eventAt,
      createdAt: activity.createdAt,
      title: activity.kind,
      text: activity.text,
      sourceIds: activity.sourceIds,
    })),
    ...sources.map((source) => ({
      id: source.id,
      type: 'source' as const,
      eventAt: source.eventAt,
      createdAt: source.createdAt,
      title: source.title,
      text: source.notes,
      sourceIds: [source.id],
    })),
  ].sort(
    (a, b) =>
      compareTimestamps(a.eventAt, b.eventAt) ||
      compareTimestamps(a.createdAt, b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
