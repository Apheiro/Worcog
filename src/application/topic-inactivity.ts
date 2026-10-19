import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import dayjs from 'dayjs';
import { z } from 'zod';

extend([mixPlugin]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const topicInactivitySchema = z.object({
  days: z.number().int().positive(),
  initialColor: color,
  extremeColor: color,
});
export type TopicInactivitySettings = z.infer<typeof topicInactivitySchema>;
export const defaultTopicInactivitySettings: TopicInactivitySettings = {
  days: 14,
  initialColor: '#e5e7eb',
  extremeColor: '#ef4444',
};

export function deserializeTopicInactivity(value: string | undefined): TopicInactivitySettings {
  if (value === undefined) return defaultTopicInactivitySettings;
  try {
    const parsed = topicInactivitySchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : defaultTopicInactivitySettings;
  } catch {
    return defaultTopicInactivitySettings;
  }
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
    color: colord(settings.initialColor).mix(settings.extremeColor, progress).toHex(),
  };
}
