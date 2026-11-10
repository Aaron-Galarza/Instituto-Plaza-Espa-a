import {
  addDays,
  addMonths,
  eachDate,
  endOfMonth,
  endOfWeek,
  formatLongDate,
  formatMinutesRange,
  formatMonth,
  formatShortDate,
  minutesToTime,
  startOfMonth,
  startOfWeek,
  todayInInstitutionTz,
} from '@plaza/shared';

export function today(): string {
  return todayInInstitutionTz();
}

export function dateLabel(date: string): string {
  return formatLongDate(date);
}

export function shortDate(date: string): string {
  return formatShortDate(date);
}

export function monthLabel(date: string): string {
  return formatMonth(date);
}

export function timeRange(start: number, end: number): string {
  return `${minutesToTime(start)}–${minutesToTime(end)}`;
}

export function formatRangeLabel(start: number, end: number): string {
  return formatMinutesRange(start, end);
}

export function weekRange(date: string): { from: string; to: string } {
  return { from: startOfWeek(date), to: endOfWeek(date) };
}

export function monthRange(date: string): { from: string; to: string } {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

export function viewRange(
  view: 'day' | 'week' | 'month',
  date: string,
): { from: string; to: string } {
  if (view === 'week') return weekRange(date);
  if (view === 'month') return monthRange(date);
  return { from: date, to: date };
}

export function monthGrid(date: string): string[] {
  const first = startOfMonth(date);
  const start = startOfWeek(first);
  const last = endOfMonth(date);
  const end = endOfWeek(last);
  return eachDate(start, end);
}

export function stepDate(view: 'day' | 'week' | 'month', date: string, direction: -1 | 1): string {
  if (view === 'month') return addMonths(date, direction);
  if (view === 'week') return addDays(date, direction * 7);
  return addDays(date, direction);
}

export function dayNumber(date: string): string {
  return date.slice(8, 10).replace(/^0/, '');
}

export function memberNames<T extends { id: string; firstName: string; lastName: string }>(
  ids: string[],
  people: T[],
): string[] {
  return ids
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is T => Boolean(person))
    .map((person) => `${person.firstName} ${person.lastName}`);
}
