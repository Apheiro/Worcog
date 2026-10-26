'use client';
import { useLabels } from '../i18n/use-labels';

export function NotificationText({ label, message }: { label: string; message: string }) {
  const localize = useLabels();
  return (
    <span>
      {localize(label)}: {localize(message)}
    </span>
  );
}
