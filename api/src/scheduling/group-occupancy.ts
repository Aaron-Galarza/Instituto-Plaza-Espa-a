import { type GroupOccupancy } from '@plaza/shared';
import type { SchedulingContext } from './scheduling.types';
import { expandOccurrences } from './schedule-occurrences';
import { peakConcurrentPatients, type Interval } from './schedule-metrics';

export function buildGroupOccupancy(
  ctx: SchedulingContext,
  from: string,
  to: string,
): GroupOccupancy[] {
  const occurrences = expandOccurrences(ctx, from, to).filter(
    (occurrence) => occurrence.status !== 'cancelled',
  );
  const groups = new Map<string, GroupOccupancy & { intervals: Interval[] }>();

  for (const occurrence of occurrences) {
    for (const segment of occurrence.segments) {
      if (!segment.groupId) continue;
      const group = ctx.groups.find((item) => item.id === segment.groupId);
      if (!group) continue;
      const key = `${occurrence.date}|${segment.groupId}`;
      const entry =
        groups.get(key) ??
        ({
          groupId: group.id,
          groupName: group.name,
          date: occurrence.date,
          capacity: group.capacity,
          maxSimultaneous: 0,
          patientIds: [],
          professionals: [],
          serviceName: segment.serviceName,
          spaceName: segment.spaceName,
          startMinute: segment.startMinute,
          endMinute: segment.endMinute,
          intervals: [],
        } satisfies GroupOccupancy & { intervals: Interval[] });
      entry.intervals.push({
        startMinute: segment.startMinute,
        endMinute: segment.endMinute,
        patientId: occurrence.patientId,
      });
      if (!entry.patientIds.includes(occurrence.patientId))
        entry.patientIds.push(occurrence.patientId);
      for (const professional of segment.professionals) {
        if (!entry.professionals.some((item) => item.id === professional.id)) {
          entry.professionals.push(professional);
        }
      }
      entry.startMinute = Math.min(entry.startMinute, segment.startMinute);
      entry.endMinute = Math.max(entry.endMinute, segment.endMinute);
      entry.spaceName = entry.spaceName ?? segment.spaceName;
      groups.set(key, entry);
    }
  }

  return [...groups.values()]
    .map((entry) => {
      const { intervals, ...rest } = entry;
      return {
        ...rest,
        maxSimultaneous: peakConcurrentPatients(intervals),
        patientIds: rest.patientIds.sort(),
        professionals: rest.professionals.sort((a, b) => a.name.localeCompare(b.name, 'es')),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.groupName.localeCompare(b.groupName, 'es'));
}
