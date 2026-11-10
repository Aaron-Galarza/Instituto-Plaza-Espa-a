export interface Interval {
  startMinute: number;
  endMinute: number;
  patientId: string;
}

function mergeIntervals(intervals: Array<{ startMinute: number; endMinute: number }>): number {
  const sorted = [...intervals].sort((a, b) => a.startMinute - b.startMinute);
  let total = 0;
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  for (const interval of sorted) {
    if (currentStart === null || currentEnd === null) {
      currentStart = interval.startMinute;
      currentEnd = interval.endMinute;
      continue;
    }
    if (interval.startMinute <= currentEnd) {
      currentEnd = Math.max(currentEnd, interval.endMinute);
    } else {
      total += currentEnd - currentStart;
      currentStart = interval.startMinute;
      currentEnd = interval.endMinute;
    }
  }
  if (currentStart !== null && currentEnd !== null) total += currentEnd - currentStart;
  return total;
}

/** Suma de intervalos únicos (evita duplicar sesiones grupales simultáneas). */
export function mergedMinutes(
  intervals: Array<{ startMinute: number; endMinute: number }>,
): number {
  if (intervals.length === 0) return 0;
  return mergeIntervals(intervals);
}

export function peakConcurrentPatients(intervals: Interval[]): number {
  interface Event {
    minute: number;
    kind: 'start' | 'end';
    patientId: string;
  }
  const events: Event[] = [];
  for (const interval of intervals) {
    events.push({ minute: interval.startMinute, kind: 'start', patientId: interval.patientId });
    events.push({ minute: interval.endMinute, kind: 'end', patientId: interval.patientId });
  }
  events.sort((a, b) => a.minute - b.minute);
  const active = new Map<string, number>();
  let max = 0;
  let index = 0;
  while (index < events.length) {
    const minute = events[index]!.minute;
    const ending: Event[] = [];
    const starting: Event[] = [];
    while (index < events.length && events[index]!.minute === minute) {
      const event = events[index]!;
      if (event.kind === 'end') ending.push(event);
      else starting.push(event);
      index += 1;
    }
    for (const event of ending) {
      const count = active.get(event.patientId) ?? 0;
      if (count <= 1) active.delete(event.patientId);
      else active.set(event.patientId, count - 1);
    }
    for (const event of starting) {
      active.set(event.patientId, (active.get(event.patientId) ?? 0) + 1);
    }
    max = Math.max(max, active.size);
  }
  return max;
}
