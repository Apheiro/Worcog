'use client';
import type { Topic } from '../domain/model';
import { topicInactivity } from '../application/topic-inactivity';
import { useWorklog } from '../providers/worklog';

export function TopicInactivityIndicator({
  topic,
  edge = false,
}: {
  topic: Topic;
  edge?: boolean;
}) {
  const { inactivitySettings } = useWorklog();
  const inactivity = topicInactivity(topic.updatedAt, inactivitySettings);
  const label = `${inactivity.days} ${inactivity.days === 1 ? 'day' : 'days'} since last activity. Inactivity threshold: ${inactivitySettings.days} days.`;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`w-[1.5px] shrink-0 ${edge ? 'absolute left-0 inset-y-0' : 'inline-block h-4 rounded-[1px]'}`}
      style={{ backgroundColor: inactivity.color }}
    />
  );
}
