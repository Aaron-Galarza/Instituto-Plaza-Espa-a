import {
  isoWeekday,
  type AssignmentIssue,
  type AssignmentIssueDetail,
  type ResolveIssueInput,
  type ScheduleRule,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { expandOccurrences } from '../scheduling/engine';
import { ScheduleService } from '../scheduling/schedule.service';
import { decorateIssues } from './availability-issue-details';

export async function rescheduleIssue(
  tx: DataStore,
  audit: AuditService,
  schedule: ScheduleService,
  actor: SessionUser,
  issue: AssignmentIssue,
  rule: ScheduleRule,
  input: Extract<ResolveIssueInput, { action: 'reschedule' }>,
): Promise<AssignmentIssueDetail> {
  const ctx = await loadSchedulingContext(tx);
  const occurrence = expandOccurrences(ctx, issue.date, issue.date).find(
    (item) => item.ruleId === rule.id && item.status !== 'cancelled',
  );
  if (!occurrence) throw AppError.conflict('La fecha ya no tiene una jornada programada.');
  const offset = input.startMinute - occurrence.startMinute;
  const endMinute = occurrence.endMinute + offset;
  if (endMinute > 1440 || endMinute <= input.startMinute) {
    throw AppError.validation('El nuevo horario debe terminar antes de las 24:00.');
  }
  if (input.newDate === issue.date && offset === 0) {
    throw AppError.validation('Elegí otra fecha u horario para reprogramar.');
  }

  await schedule.assertCompatibleGroupSessionTx(
    tx,
    input.newDate,
    occurrence.segments.map((segment) => ({
      serviceId: segment.serviceId,
      professionalIds: segment.professionalIds,
      groupId: segment.groupId,
      spaceId: segment.spaceId,
      startMinute: segment.startMinute + offset,
      endMinute: segment.endMinute + offset,
      modality: segment.modality,
    })),
    rule.id,
  );

  await schedule.applyCancellationTx(tx, actor, rule, issue.date, input.reason, {
    skipAudit: true,
  });
  const created = await schedule.createRuleTx(tx, actor, {
    patientId: occurrence.patientId,
    daysOfWeek: [isoWeekday(input.newDate)],
    effectiveFrom: input.newDate,
    effectiveTo: input.newDate,
    startMinute: input.startMinute,
    endMinute,
    segments: occurrence.segments.map((segment) => ({
      id: segment.id,
      serviceId: segment.serviceId,
      professionalIds: segment.professionalIds,
      groupId: segment.groupId,
      spaceId: segment.spaceId,
      startMinute: segment.startMinute + offset,
      endMinute: segment.endMinute + offset,
      modality: segment.modality as 'individual' | 'group' | 'shared',
      notes: segment.notes ?? undefined,
    })),
    notes: rule.notes ?? undefined,
  });
  const updated = await tx.repo('assignmentIssues').update(issue.id, {
    status: 'resolved',
    resolution: `Reprogramada para ${input.newDate}. ${input.reason}`,
    resolvedBy: actor.id,
    resolvedAt: new Date().toISOString(),
  });
  await audit.record(
    {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      action: 'issue.reschedule',
      entity: 'assignmentIssue',
      entityId: issue.id,
      metadata: {
        fromRuleId: rule.id,
        toRuleId: created.rule.id,
        fromDate: issue.date,
        toDate: input.newDate,
        reason: input.reason,
      },
    },
    tx,
  );
  return (await decorateIssues(tx, [updated]))[0]!;
}
