import type { DateRange, IsoDate, Weekday } from '@/types';
import { WEEKDAY_VALUES } from '@/types';

/**
 * All demo data is anchored to this date rather than `new Date()` so the seeded
 * pipeline, calendar and analytics stay coherent with each other. Local edits
 * still use the real clock.
 */
export const DEMO_TODAY: IsoDate = '2026-09-20';

export function today(): IsoDate {
  return DEMO_TODAY;
}

export function toIsoDate(date: Date): IsoDate {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse `YYYY-MM-DD` as a local date, avoiding the UTC shift of `new Date(str)`. */
export function parseIsoDate(value: IsoDate): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function addMonths(value: IsoDate, months: number): IsoDate {
  const date = parseIsoDate(value);
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date);
}

export function diffInDays(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86400000);
}

export function isWithinRange(value: IsoDate, range: DateRange): boolean {
  const date = value.slice(0, 10);
  return date >= range.from && date <= range.to;
}

export function rangeOfLastDays(days: number, anchor: IsoDate = DEMO_TODAY): DateRange {
  return { from: addDays(anchor, -(days - 1)), to: anchor };
}

/** The window immediately before `range`, used for period-over-period deltas. */
export function previousRange(range: DateRange): DateRange {
  const length = diffInDays(range.from, range.to) + 1;
  return { from: addDays(range.from, -length), to: addDays(range.from, -1) };
}

export function eachDay(range: DateRange): IsoDate[] {
  const days: IsoDate[] = [];
  let cursor = range.from;
  while (cursor <= range.to) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function weekdayOf(value: IsoDate): Weekday {
  // getDay() is 0=Sunday; WEEKDAY_VALUES starts at Monday.
  const index = (parseIsoDate(value).getDay() + 6) % 7;
  return WEEKDAY_VALUES[index];
}

export function startOfMonth(value: IsoDate): IsoDate {
  return `${value.slice(0, 7)}-01`;
}

export function endOfMonth(value: IsoDate): IsoDate {
  const date = parseIsoDate(value);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Monday-first start of the week containing `value`. */
export function startOfWeek(value: IsoDate, weekStartsOn: Weekday = 'mon'): IsoDate {
  const startIndex = WEEKDAY_VALUES.indexOf(weekStartsOn);
  const current = WEEKDAY_VALUES.indexOf(weekdayOf(value));
  const delta = (current - startIndex + 7) % 7;
  return addDays(value, -delta);
}

/** Six-week grid (42 cells) covering the month that contains `value`. */
export function monthGrid(value: IsoDate, weekStartsOn: Weekday = 'mon'): IsoDate[] {
  const first = startOfWeek(startOfMonth(value), weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const weekdayLong = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });

export function formatDayMonth(value: IsoDate): string {
  return dayMonth.format(parseIsoDate(value));
}

export function formatFullDate(value: IsoDate): string {
  return dayMonthYear.format(parseIsoDate(value));
}

export function formatMonthYear(value: IsoDate): string {
  return monthYear.format(parseIsoDate(value));
}

export function formatWeekday(value: IsoDate): string {
  return weekdayLong.format(parseIsoDate(value));
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${dayMonthYear.format(date)}, ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatRange(range: DateRange): string {
  return `${formatDayMonth(range.from)} – ${formatFullDate(range.to)}`;
}

/** "3 days ago" / "in 2 days", relative to the demo anchor date. */
export function relativeToToday(value: IsoDate, anchor: IsoDate = DEMO_TODAY): string {
  const days = diffInDays(anchor, value.slice(0, 10));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function isOverdue(value: IsoDate, anchor: IsoDate = DEMO_TODAY): boolean {
  return value.slice(0, 10) < anchor;
}

export function isoDateTime(date: IsoDate, time = '09:00'): string {
  return `${date}T${time}:00+05:30`;
}
