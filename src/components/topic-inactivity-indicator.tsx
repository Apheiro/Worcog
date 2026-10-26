'use client';
import type { Topic } from '../domain/model';
import { topicIndicator } from '../application/topic-inactivity';
import { useWorcog } from '../providers/worcog';
import { useIndicatorText } from '../i18n/use-indicator-text';

export function TopicInactivityIndicator({
  topic,
  edge = false,
}: {
  topic: Topic;
  edge?: boolean;
}) {
  const { inactivitySettings } = useWorcog();
  const indicator = topicIndicator(topic, inactivitySettings);
  const label = useIndicatorText(indicator);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`w-[1.5px] shrink-0 ${edge ? 'absolute left-0 inset-y-0' : 'inline-block h-4 rounded-[1px]'}`}
      style={{ backgroundColor: indicator.color }}
    />
  );
}
