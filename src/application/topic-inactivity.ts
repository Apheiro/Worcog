import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import dayjs from 'dayjs';
import { z } from 'zod';
import type { Topic } from '../domain/model';

extend([mixPlugin]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const topicInactivitySchema = z.object({
  days: z.number().int().positive(),
  excludedWeekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  initialColor: color,
  midpointColor: color,
  extremeColor: color,
});
export type TopicInactivitySettings = z.infer<typeof topicInactivitySchema>;
export const defaultTopicInactivitySettings: TopicInactivitySettings = {
  days: 14,
  excludedWeekdays: [],
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

function inactivityDays(lastActivity: string, excludedWeekdays: number[], now: dayjs.Dayjs) {
  const start = dayjs(lastActivity);
  if (!start.isValid() || !now.isAfter(start)) return 0;
  if (!excludedWeekdays.length) return now.diff(start, 'day', true);
  const excluded = new Set(excludedWeekdays);
  if (start.isSame(now, 'day')) {
    return excluded.has(start.day()) ? 0 : now.diff(start, 'day', true);
  }
  const firstMidnight = start.add(1, 'day').startOf('day');
  const lastMidnight = now.startOf('day');
  const wholeDays = lastMidnight.diff(firstMidnight, 'day');
  // Count full weeks at once, then at most six remaining weekdays.
  let elapsed = Math.floor(wholeDays / 7) * (7 - excluded.size);
  for (let day = 0; day < wholeDays % 7; day++) {
    if (!excluded.has((firstMidnight.day() + day) % 7)) elapsed++;
  }
  if (!excluded.has(start.day())) elapsed += firstMidnight.diff(start, 'day', true);
  if (!excluded.has(now.day())) elapsed += now.diff(lastMidnight, 'day', true);
  return elapsed;
}

/** Topic freshness is maintained centrally when its own or related records change. */
export function topicInactivity(
  lastActivity: string,
  settings: TopicInactivitySettings,
  now = dayjs(),
) {
  const elapsed = inactivityDays(lastActivity, settings.excludedWeekdays, now);
  const progress = Math.min(1, elapsed / settings.days);
  return {
    days: Math.floor(elapsed),
    stale: elapsed >= settings.days,
    color: indicatorColor(progress, settings),
  };
}

export function deadlineIndicator(createdAt: string, deadline: string | null, settings: TopicInactivitySettings, now = dayjs()) {
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
        color: indicatorColor(progress, settings),
        label: `Deadline: ${end.format('MMM D, YYYY')}. ${progress === 1 ? 'Deadline passed.' : `${Math.round(progress * 100)}% of the available time elapsed.`}`,
      };
    }
  }
  return null;
}

export function topicIndicator(
  topic: Pick<Topic, 'createdAt' | 'updatedAt' | 'targetDate' | 'startDate'>,
  settings: TopicInactivitySettings,
  now = dayjs(),
) {
  const deadline = deadlineIndicator(topic.startDate ?? topic.createdAt, topic.targetDate, settings, now);
  if (deadline) return deadline;
  const inactivity = topicInactivity(topic.updatedAt, settings, now);
  return {
    color: inactivity.color,
    label: `${inactivity.days} ${settings.excludedWeekdays.length ? 'counted ' : ''}${inactivity.days === 1 ? 'day' : 'days'} since last activity. Inactivity threshold: ${settings.days} days.${settings.excludedWeekdays.length ? ' Excluded weekdays do not count.' : ''}`,
  };
}
