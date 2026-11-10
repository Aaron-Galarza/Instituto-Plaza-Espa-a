import { createHash } from 'node:crypto';
import { type ScheduleConflict, type ScheduleOccurrence, type ScheduleSummary } from '@plaza/shared';
import type { SchedulingContext } from './scheduling.types';
import type { Instance, ConflictInput } from './conflict-types';
import { checkReferences } from './conflict-references';
import { checkPatientAndCapacity } from './conflict-patient-capacity';
import { checkProfessionalConflicts } from './conflict-professionals';
import { expandOccurrences } from './schedule-occurrences';
export { expandOccurrences } from './schedule-occurrences';
export { mergedMinutes, peakConcurrentPatients } from './schedule-metrics';
export { buildGroupOccupancy } from './group-occupancy';

function conflictId(code: string, date: string, occurrenceKeys: string[], extra = ''): string {
  const signature = [code, date, [...occurrenceKeys].sort().join(','), extra].join('|');
  return createHash('sha1').update(signature).digest('hex').slice(0, 16);
}

export function detectConflicts(
  ctx: SchedulingContext,
  occurrences: ScheduleOccurrence[],
): ScheduleConflict[] {
  const conflicts = new Map<string, ScheduleConflict>();
  const ruleMap = new Map(ctx.rules.map((rule) => [rule.id, rule]));

  const instances: Instance[] = [];
  for (const occurrence of occurrences) {
    if (occurrence.status === 'cancelled') continue;
    for (const segment of occurrence.segments) {
      instances.push({ occurrence, segment });
    }
  }

  const add = (input: ConflictInput): void => {
    const uniqueOccurrences = [
      ...new Set(input.instances.map((item) => item.occurrence.key)),
    ].sort();
    const id = conflictId(input.code, input.date, uniqueOccurrences, input.extra ?? '');
    if (conflicts.has(id)) return;
    conflicts.set(id, {
      id,
      severity: input.severity,
      code: input.code,
      message: input.message,
      date: input.date,
      occurrenceKeys: uniqueOccurrences,
      ruleIds: [...new Set(input.instances.map((item) => item.occurrence.ruleId))].sort(),
      patientIds: [...new Set(input.instances.map((item) => item.occurrence.patientId))].sort(),
      professionalIds: [
        ...new Set(input.instances.flatMap((item) => item.segment.professionalIds)),
      ].sort(),
      segmentIds: [...new Set(input.instances.map((item) => item.segment.id))].sort(),
      groupId: input.instances.find((item) => item.segment.groupId)?.segment.groupId ?? null,
      spaceId: input.instances.find((item) => item.segment.spaceId)?.segment.spaceId ?? null,
    });
  };

  checkReferences(ctx, instances, add);

  checkPatientAndCapacity(ctx, instances, add);

  checkProfessionalConflicts(ctx, instances, add);

  // Reglas inexistentes/inactivas que produjeron la ocurrencia
  for (const occurrence of occurrences) {
    if (occurrence.status === 'cancelled') continue;
    const rule = ruleMap.get(occurrence.ruleId);
    if (!rule) {
      add({
        severity: 'error',
        code: 'invalid_reference',
        message: 'La recurrencia que origina la jornada ya no existe.',
        date: occurrence.date,
        instances: instances.filter((item) => item.occurrence.key === occurrence.key),
        extra: 'rule',
      });
    }
  }

  return [...conflicts.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.message.localeCompare(b.message, 'es');
  });
}

export function attachConflictCounts(
  occurrences: ScheduleOccurrence[],
  conflicts: ScheduleConflict[],
): void {
  const counts = new Map<string, Set<string>>();
  for (const conflict of conflicts) {
    if (conflict.severity !== 'error') continue;
    for (const key of conflict.occurrenceKeys) {
      const set = counts.get(key) ?? new Set<string>();
      set.add(conflict.id);
      counts.set(key, set);
    }
  }
  for (const occurrence of occurrences) {
    occurrence.conflictCount = counts.get(occurrence.key)?.size ?? 0;
  }
}

export interface ScheduleView {
  occurrences: ScheduleOccurrence[];
  conflicts: ScheduleConflict[];
  summary: ScheduleSummary;
}

export function buildScheduleView(ctx: SchedulingContext, from: string, to: string): ScheduleView {
  const occurrences = expandOccurrences(ctx, from, to);
  const conflicts = detectConflicts(ctx, occurrences);
  attachConflictCounts(occurrences, conflicts);
  return {
    occurrences,
    conflicts,
    summary: {
      occurrences: occurrences.filter((occurrence) => occurrence.status !== 'cancelled').length,
      patients: new Set(
        occurrences
          .filter((occurrence) => occurrence.status !== 'cancelled')
          .map((occurrence) => occurrence.patientId),
      ).size,
      services: occurrences
        .filter((occurrence) => occurrence.status !== 'cancelled')
        .reduce((total, occurrence) => total + occurrence.segments.length, 0),
      professionals: new Set(
        occurrences.flatMap((occurrence) =>
          occurrence.status === 'cancelled'
            ? []
            : occurrence.segments.flatMap((segment) => segment.professionalIds),
        ),
      ).size,
      errors: conflicts.filter((conflict) => conflict.severity === 'error').length,
      warnings: conflicts.filter((conflict) => conflict.severity === 'warning').length,
    },
  };
}

export function relevantNewConflicts(
  before: ScheduleConflict[],
  after: ScheduleConflict[],
  predicate: (conflict: ScheduleConflict) => boolean,
): ScheduleConflict[] {
  const previous = new Set(before.map((conflict) => conflict.id));
  return after.filter(
    (conflict) =>
      conflict.severity === 'error' && predicate(conflict) && !previous.has(conflict.id),
  );
}
