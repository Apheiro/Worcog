import { z } from 'zod';
import type { Workspace } from './model';
import { isDateOnly } from './dates';
const id = z.string().min(1).max(200);
const text = z.string().max(100000);
const title = z.string().trim().min(1, 'A title is required.').max(500);
const timestamp = z.string().datetime({ offset: true });
const date = z.string().refine(isDateOnly, 'Expected a valid YYYY-MM-DD date.');
const ids = z
  .array(id)
  .max(10000)
  .refine((values) => new Set(values).size === values.length, 'Duplicate relationship.');
const tags = z.array(z.string().trim().min(1).max(100)).max(100);
export const statusSchema = z.enum(['pending', 'in_progress', 'blocked', 'completed', 'canceled']);
const priority = z.enum(['low', 'normal', 'high', 'urgent']);
const base = { id, createdAt: timestamp, updatedAt: timestamp };
export const topicSchema = z
  .object({
    ...base,
    title,
    summary: text,
    category: z.string().max(200),
    status: statusSchema,
    priority,
    owner: z.string().max(500),
    participants: text,
    tags,
    nextAction: text,
    targetDate: date.nullable(),
    closedAt: timestamp.nullable(),
    archived: z.boolean(),
    relatedTopicIds: ids,
  })
  .strict();
export const taskSchema = z
  .object({
    ...base,
    title,
    description: text,
    topicId: id,
    parentId: id.nullable(),
    status: statusSchema,
    priority,
    owner: z.string().max(500),
    startDate: date.nullable(),
    dueDate: date.nullable(),
    completedAt: timestamp.nullable(),
    nextAction: text,
    tags,
    sourceIds: ids,
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
    recurrenceRootId: id.nullable(),
    occurrenceDate: date.nullable(),
  })
  .strict();
export const activitySchema = z
  .object({
    ...base,
    text: text.refine((s) => s.trim().length > 0, 'Activity text is required.'),
    kind: z.enum([
      'note',
      'progress',
      'decision',
      'blocker',
      'meeting',
      'outcome',
      'status',
      'milestone',
    ]),
    eventAt: timestamp,
    topicIds: ids,
    taskIds: ids,
    sourceIds: ids,
    revisions: z.array(z.object({ text, revisedAt: timestamp }).strict()),
  })
  .strict();
export const sourceSchema = z
  .object({
    ...base,
    title,
    kind: z.enum([
      'email',
      'teams',
      'invgate',
      'document',
      'meeting',
      'url',
      'phone',
      'system',
      'other',
    ]),
    platform: z.string().max(500),
    identifier: z.string().max(1000),
    url: z
      .string()
      .max(4096)
      .refine((value) => {
        if (!value) return true;
        try {
          return ['http:', 'https:', 'msteams:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, 'Enter a valid HTTP, HTTPS, or Teams link.'),
    eventAt: timestamp,
    participants: text,
    notes: text,
    tags,
    topicIds: ids,
  })
  .strict();
export const attachmentSchema = z
  .object({
    id,
    originalName: z.string().min(1).max(500),
    managedName: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/)
      .refine((s) => s !== '.' && s !== '..'),
    mime: z.string().max(200),
    size: z
      .number()
      .int()
      .nonnegative()
      .max(100 * 1024 * 1024),
    addedAt: timestamp,
    topicIds: ids,
    taskIds: ids,
    activityIds: ids,
    sourceIds: ids,
  })
  .strict();
export const workspaceSchema: z.ZodType<Workspace> = z
  .object({
    formatVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    topics: z.array(topicSchema),
    tasks: z.array(taskSchema),
    activities: z.array(activitySchema),
    sources: z.array(sourceSchema),
    attachments: z.array(attachmentSchema),
  })
  .strict()
  .superRefine((workspace, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const sets = {
      topic: new Set(workspace.topics.map((x) => x.id)),
      task: new Set(workspace.tasks.map((x) => x.id)),
      activity: new Set(workspace.activities.map((x) => x.id)),
      source: new Set(workspace.sources.map((x) => x.id)),
    };
    for (const group of [
      workspace.topics,
      workspace.tasks,
      workspace.activities,
      workspace.sources,
      workspace.attachments,
    ])
      if (new Set(group.map((x) => x.id)).size !== group.length)
        fail('Entity IDs must be unique within each type.');
    const refs = (values: string[], kind: keyof typeof sets) => {
      if (values.some((value) => !sets[kind].has(value))) fail(`Missing ${kind} relationship.`);
    };
    for (const topic of workspace.topics) {
      refs(topic.relatedTopicIds, 'topic');
      if (topic.relatedTopicIds.includes(topic.id)) fail('A topic cannot relate to itself.');
    }
    const tasks = new Map(workspace.tasks.map((task) => [task.id, task]));
    const occurrences = new Set<string>();
    for (const task of workspace.tasks) {
      refs([task.topicId], 'topic');
      refs(task.sourceIds, 'source');
      if (task.startDate && task.dueDate && task.startDate > task.dueDate)
        fail('Task start date must be on or before its due date.');
      if (task.recurrence !== 'none' && !task.dueDate) fail('Recurring tasks require a due date.');
      if (task.parentId) {
        refs([task.parentId], 'task');
        if (tasks.get(task.parentId)?.topicId !== task.topicId)
          fail('Subtasks must belong to the parent topic.');
        const seen = new Set([task.id]);
        let parent: string | null = task.parentId;
        while (parent) {
          if (seen.has(parent)) {
            fail('Task hierarchy contains a cycle.');
            break;
          }
          seen.add(parent);
          parent = tasks.get(parent)?.parentId ?? null;
        }
      }
      if (task.recurrenceRootId) {
        refs([task.recurrenceRootId], 'task');
        const root = tasks.get(task.recurrenceRootId);
        if (
          !task.occurrenceDate ||
          root?.recurrenceRootId ||
          root?.id === task.id ||
          root?.recurrence === 'none'
        )
          fail('Invalid recurrence root or occurrence.');
        const key = `${task.recurrenceRootId}:${task.occurrenceDate}`;
        if (occurrences.has(key)) fail('Duplicate recurrence occurrence.');
        occurrences.add(key);
      } else if (task.occurrenceDate) fail('An occurrence requires a recurrence root.');
    }
    for (const source of workspace.sources) refs(source.topicIds, 'topic');
    for (const item of [...workspace.activities, ...workspace.attachments]) {
      refs(item.topicIds, 'topic');
      refs(item.taskIds, 'task');
      refs(item.sourceIds, 'source');
    }
    for (const file of workspace.attachments) refs(file.activityIds, 'activity');
  });
