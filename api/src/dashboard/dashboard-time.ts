import { isoWeekday } from '@plaza/shared';
import type { SchedulingContext } from '../scheduling/scheduling.types';

export interface Interval {
  startMinute: number;
  endMinute: number;
}

function mergeRanges(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  );
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.startMinute > last.endMinute) {
      merged.push({ ...interval });
    } else {
      last.endMinute = Math.max(last.endMinute, interval.endMinute);
    }
  }
  return merged;
}

function totalMinutes(intervals: Interval[]): number {
  return intervals.reduce(
    (total, interval) => total + (interval.endMinute - interval.startMinute),
    0,
  );
}

function overlapMinutes(a: Interval[], b: Interval[]): number {
  let total = 0;
  for (const left of a) {
    for (const right of b) {
      const start = Math.max(left.startMinute, right.startMinute);
      const end = Math.min(left.endMinute, right.endMinute);
      if (start < end) total += end - start;
    }
  }
  return total;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function availableMinutes(ctx: SchedulingContext, dates: string[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const date of dates) {
    const weekday = isoWeekday(date);
    for (const professional of ctx.professionals) {
      if (professional.status !== 'active') continue;
      const entries = ctx.availability.filter(
        (entry) =>
          entry.professionalId === professional.id &&
          entry.status === 'active' &&
          entry.kind === 'regular' &&
          entry.effectiveFrom <= date &&
          (!entry.effectiveTo || entry.effectiveTo >= date) &&
          (entry.dayOfWeek === null || entry.dayOfWeek === weekday),
      );
      if (entries.length === 0) continue;

      const absences = ctx.availability.filter(
        (entry) =>
          entry.professionalId === professional.id &&
          entry.status === 'active' &&
          (entry.kind === 'absence' || entry.kind === 'block') &&
          entry.effectiveFrom <= date &&
          (!entry.effectiveTo || entry.effectiveTo >= date) &&
          (entry.dayOfWeek === null || entry.dayOfWeek === weekday),
      );

      const regular = mergeRanges(
        entries.map((entry) => ({ startMinute: entry.startMinute, endMinute: entry.endMinute })),
      );
      const blocked = mergeRanges(
        absences.map((entry) => ({ startMinute: entry.startMinute, endMinute: entry.endMinute })),
      );
      const available = totalMinutes(regular) - overlapMinutes(regular, blocked);
      totals.set(professional.id, (totals.get(professional.id) ?? 0) + Math.max(0, available));
    }
  }
  return totals;
}
