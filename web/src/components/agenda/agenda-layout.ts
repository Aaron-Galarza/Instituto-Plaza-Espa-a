import type { ScheduleOccurrence } from '@plaza/shared';

export function useHourBounds(occurrences: ScheduleOccurrence[]): { startHour: number; endHour: number } {
  let start = 7 * 60;
  let end = 22 * 60;
  for (const occurrence of occurrences) {
    start = Math.min(start, occurrence.startMinute);
    end = Math.max(end, occurrence.endMinute);
  }
  return {
    startHour: Math.max(0, Math.floor(start / 60)),
    endHour: Math.min(24, Math.max(Math.ceil(end / 60), Math.floor(start / 60) + 1)),
  };
}

export function layoutEvents<T extends { startMinute: number; endMinute: number }>(
  events: T[],
): Array<T & { column: number; columns: number }> {
  const sorted = [...events].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  );
  const columnEnds: number[] = [];
  const assigned = sorted.map((event) => {
    let column = columnEnds.findIndex((end) => end <= event.startMinute);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMinute);
    } else {
      columnEnds[column] = event.endMinute;
    }
    return { ...event, column };
  });
  const columns = Math.max(1, columnEnds.length);
  return assigned.map((event) => ({ ...event, columns }));
}
