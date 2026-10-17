import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { Task } from './model';
dayjs.extend(customParseFormat);
export const isDateOnly = (value: string) => dayjs(value, 'YYYY-MM-DD', true).isValid();
export const today = () => dayjs().format('YYYY-MM-DD');
export const formatDate = (value: string | null) =>
  value ? dayjs(value).format('MMM D, YYYY') : 'No date';
export const formatTimestamp = (value: string) => dayjs(value).format('MMM D, YYYY HH:mm');
export const isOpen = (status: Task['status']) => status !== 'completed' && status !== 'canceled';
export const isOverdue = (task: Task, date = today()) =>
  isOpen(task.status) && !!task.dueDate && task.dueDate < date;
/** Always calculate from the original anchor, so Jan 31 -> Feb 28 -> Mar 31. */
export function occurrenceDate(anchor: string, rule: Task['recurrence'], index: number): string {
  if (!isDateOnly(anchor) || !Number.isInteger(index) || index < 0)
    throw new Error('Invalid recurrence date or index.');
  if (rule === 'none') return anchor;
  return dayjs(anchor)
    .add(index, rule === 'daily' ? 'day' : rule === 'weekly' ? 'week' : 'month')
    .format('YYYY-MM-DD');
}
export function toTimestamp(local: string): string {
  const date = dayjs(local);
  if (!date.isValid()) throw new Error('Enter a valid event date.');
  return date.toISOString();
}

export const compareTimestamps = (first: string, second: string) =>
  dayjs(first).valueOf() - dayjs(second).valueOf();

/** Calendar-day filters follow the displayed local date; date-only values never shift. */
export const calendarDate = (value: string) =>
  isDateOnly(value) ? value : dayjs(value).format('YYYY-MM-DD');
