import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import dayjs from 'dayjs';
import { z } from 'zod';
import type { Topic } from '../domain/model';

extend([mixPlugin]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const topicInactivitySchema = z.object({
  days: z.number().int().positive(),
  initialColor: color,
  midpointColor: color,
  extremeColor: color,
});
export type TopicInactivitySettings = z.infer<typeof topicInactivitySchema>;
export const defaultTopicInactivitySettings: TopicInactivitySettings = {
  days: 14,
  initialColor: '#e5e7eb',
  midpointColor: colord('#e5e7eb').mix('#ef4444', 0.5).toHex(),
  extremeColor: '#ef4444',
};

export function deserializeTopicInactivity(value: string | undefined): TopicInactivitySettings {
  if (value === undefined) return defaultTopicInactivitySettings;
  try {
    const parsed = topicInactivitySchema
      .extend({ midpointColor: color.optional() })
      .safeParse(JSON.parse(value));
    if (!parsed.success) return defaultTopicInactivitySettings;
    return {
      ...parsed.data,
      midpointColor:
        parsed.data.midpointColor ??
        colord(parsed.data.initialColor).mix(parsed.data.extremeColor, 0.5).toHex(),
    };
  } catch {
    return defaultTopicInactivitySettings;
  }
}

function indicatorColor(progress: number, settings: TopicInactivitySettings) {
  return progress <= 0.5
    ? colord(settings.initialColor)
        .mix(settings.midpointColor, progress * 2)
        .toHex()
    : colord(settings.midpointColor)
        .mix(settings.extremeColor, (progress - 0.5) * 2)
        .toHex();
}

/** Topic freshness is maintained centrally when its own or related records change. */
export function topicInactivity(
  lastActivity: string,
  settings: TopicInactivitySettings,
  now = dayjs(),
) {
  const elapsed = Math.max(0, now.diff(dayjs(lastActivity), 'day', true));
  const progress = Math.min(1, elapsed / settings.days);
  return {
    days: Math.floor(elapsed),
    stale: elapsed >= settings.days,
    color: indicatorColor(progress, settings),
  };
}

export function deadlineIndicator(createdAt: string, deadline: string | null, now = dayjs()) {
  if (deadline) {
    const start = dayjs(createdAt);
    const end = dayjs(deadline).endOf('day');
    if (start.isValid() && end.isValid()) {
      const duration = end.diff(start);
      const progress = !now.isBefore(end)
        ? 1
        : duration > 0
          ? Math.max(0, Math.min(1, now.diff(start) / duration))
          : 0;
      return {
        color: indicatorColor(progress, defaultTopicInactivitySettings),
        label: `Deadline: ${end.format('MMM D, YYYY')}. ${progress === 1 ? 'Deadline passed.' : `${Math.round(progress * 100)}% of the available time elapsed.`}`,
      };
    }
  }
  return null;
}

export function topicIndicator(
  topic: Pick<Topic, 'createdAt' | 'updatedAt' | 'targetDate'>,
  settings: TopicInactivitySettings,
  now = dayjs(),
) {
  const deadline = deadlineIndicator(topic.createdAt, topic.targetDate, now);
  if (deadline) return deadline;
  const inactivity = topicInactivity(topic.updatedAt, settings, now);
  return {
    color: inactivity.color,
    label: `${inactivity.days} ${inactivity.days === 1 ? 'day' : 'days'} since last activity. Inactivity threshold: ${settings.days} days.`,
  };
}
