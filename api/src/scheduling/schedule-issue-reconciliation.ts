import { intervalsOverlap, type ScheduleOccurrence } from '@plaza/shared';
import type { DataStore } from '../database/data-store';

export async function reconcileIssuesTx(
  tx: DataStore,
  occurrence: ScheduleOccurrence,
): Promise<void> {
  const pending = await tx
    .repo('assignmentIssues')
    .where(
      (issue) =>
        issue.scheduleRuleId === occurrence.ruleId &&
        issue.date === occurrence.date &&
        issue.status === 'pending',
    );
  for (const issue of pending) {
    const absence = await tx.repo('professionalAvailability').findById(issue.absenceId);
    const stillAffected =
      occurrence.status !== 'cancelled' &&
      occurrence.segments.some(
        (segment) =>
          issue.segmentIds.includes(segment.id) &&
          segment.professionalIds.includes(issue.professionalId) &&
          (!absence ||
            intervalsOverlap(
              absence.startMinute,
              absence.endMinute,
              segment.startMinute,
              segment.endMinute,
            )),
      );
    if (stillAffected) continue;
    await tx.repo('assignmentIssues').update(issue.id, {
      status: 'resolved',
      resolution: 'La modificación de la fecha hizo que la afectación dejara de existir.',
      resolvedAt: new Date().toISOString(),
    });
  }
}
