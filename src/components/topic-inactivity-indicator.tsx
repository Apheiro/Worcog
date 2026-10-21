'use client';
import type { Topic } from '../domain/model';
import { topicIndicator } from '../application/topic-inactivity';
import { useWorklog } from '../providers/worklog';

export function TopicInactivityIndicator({
  topic,
  edge = false,
}: {
  topic: Topic;
  edge?: boolean;
}) {
  const { inactivitySettings } = useWorklog();
  const indicator = topicIndicator(topic, inactivitySettings);
  return (
    <span
      role="img"
      aria-label={indicator.label}
      title={indicator.label}
      className={`w-[1.5px] shrink-0 ${edge ? 'absolute left-0 inset-y-0' : 'inline-block h-4 rounded-[1px]'}`}
      style={{ backgroundColor: indicator.color }}
    />
  );
}
