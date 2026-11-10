import { randomUUID } from 'node:crypto';
import {
  intervalsOverlap,
  isoWeekday,
  type AssignmentIssue,
  type ProfessionalAvailability,
} from '@plaza/shared';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { expandOccurrences } from '../scheduling/engine';

export async function generateIssues(
  tx: DataStore,
  absence: ProfessionalAvailability,
): Promise<AssignmentIssue[]> {
  const ctx = await loadSchedulingContext(tx);
  const from = absence.effectiveFrom;
  const to = absence.effectiveTo ?? absence.effectiveFrom;
  const occurrences = expandOccurrences(ctx, from, to).filter(
    (occurrence) => occurrence.status !== 'cancelled',
  );
  const existing = await tx.repo('assignmentIssues').all();
  const issues: AssignmentIssue[] = [];

  for (const occurrence of occurrences) {
    if (absence.dayOfWeek !== null && absence.dayOfWeek !== isoWeekday(occurrence.date)) {
      continue;
    }
    const affectedSegments = occurrence.segments.filter(
      (segment) =>
        segment.professionalIds.includes(absence.professionalId) &&
        intervalsOverlap(
          absence.startMinute,
          absence.endMinute,
          segment.startMinute,
          segment.endMinute,
        ),
    );
    if (affectedSegments.length === 0) continue;
    const duplicate = existing.some(
      (issue) =>
        issue.absenceId === absence.id &&
        issue.scheduleRuleId === occurrence.ruleId &&
        issue.date === occurrence.date,
    );
    if (duplicate) continue;

    const now = new Date().toISOString();
    const issue: AssignmentIssue = {
      id: randomUUID(),
      kind: 'professional_absence',
      professionalId: absence.professionalId,
      absenceId: absence.id,
      scheduleRuleId: occurrence.ruleId,
      date: occurrence.date,
      segmentIds: affectedSegments.map((segment) => segment.id),
      patientIds: [occurrence.patientId],
      status: 'pending',
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    issues.push(await tx.repo('assignmentIssues').insert(issue));
  }
  return issues;
}
