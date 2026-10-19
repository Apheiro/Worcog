export const statuses = ['pending', 'in_progress', 'blocked', 'completed', 'canceled'] as const;
export const priorities = ['low', 'normal', 'high', 'urgent'] as const;
export const activityKinds = [
  'note',
  'progress',
  'decision',
  'blocker',
  'meeting',
  'outcome',
  'status',
  'milestone',
] as const;
export const sourceKinds = ['mail', 'ticketing', 'meeting', 'messaging'] as const;
export const human = (s: string) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
export const selectOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: human(value) }));
