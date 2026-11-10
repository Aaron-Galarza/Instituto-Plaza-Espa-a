import { randomUUID } from 'node:crypto';
import {
  validateRuleShape,
  type ScheduleConflict,
  type ScheduleException,
  type ScheduleRule,
  type ScheduleSegment,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { buildScheduleView, relevantNewConflicts } from './engine';
import { assertCompatibleGroupSessionTx } from './group-session-validation';
import { prepareSegments } from './schedule-segment-input';
import {
  assertOccurrenceDate,
  assertDatePatch,
  newWarnings,
  type DateChangePatch,
} from './schedule-validation';
import { reconcileIssuesTx } from './schedule-issue-reconciliation';

export async function applyDateChange(
  tx: DataStore,
  actor: SessionUser,
  rule: ScheduleRule,
  date: string,
  patch: DateChangePatch,
  options: { skipAudit?: boolean } = {},
  audit: AuditService,
): Promise<{ rule: ScheduleRule; exception: ScheduleException; warnings: ScheduleConflict[] }> {
  assertOccurrenceDate(rule, date);
  assertDatePatch(patch);

  const existing = await tx
    .repo('scheduleExceptions')
    .findOne((exception) => exception.scheduleRuleId === rule.id && exception.date === date);

  const startMinute = patch.startMinute ?? existing?.startMinute ?? rule.startMinute;
  const endMinute = patch.endMinute ?? existing?.endMinute ?? rule.endMinute;
  let segments: ScheduleSegment[];
  if (patch.segments) {
    segments = await prepareSegments(tx, patch.segments);
  } else if (existing?.type === 'modified' && existing.segments?.length) {
    segments = existing.segments;
  } else {
    segments = rule.segments;
  }

  const shapeIssues = validateRuleShape({ startMinute, endMinute, segments });
  if (shapeIssues.length > 0) {
    throw AppError.validation(
      'La modificación de la fecha tiene tramos inválidos.',
      shapeIssues.map((issue) => ({ path: issue.path, message: issue.message })),
    );
  }

  const priorSegments =
    existing?.type === 'modified' && existing.segments?.length ? existing.segments : rule.segments;
  const changedGrouped = segments.filter((segment) => {
    if (!segment.groupId) return false;
    const prior = priorSegments.find((item) => item.id === segment.id);
    return (
      !prior ||
      prior.groupId !== segment.groupId ||
      prior.startMinute !== segment.startMinute ||
      prior.endMinute !== segment.endMinute ||
      prior.spaceId !== segment.spaceId ||
      [...prior.professionalIds].sort().join('|') !== [...segment.professionalIds].sort().join('|')
    );
  });
  if (changedGrouped.length) {
    await assertCompatibleGroupSessionTx(tx, date, changedGrouped, rule.id);
  }

  const now = new Date().toISOString();
  const exception: ScheduleException = {
    id: existing?.id ?? randomUUID(),
    scheduleRuleId: rule.id,
    date,
    type: 'modified',
    startMinute,
    endMinute,
    segments,
    reason: patch.reason ?? existing?.reason ?? null,
    createdBy: existing?.createdBy ?? actor.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const beforeCtx = await loadSchedulingContext(tx);
  const before = buildScheduleView(beforeCtx, date, date);
  const exceptions = existing
    ? beforeCtx.exceptions.map((item) => (item.id === existing.id ? exception : item))
    : [...beforeCtx.exceptions, exception];
  const after = buildScheduleView({ ...beforeCtx, exceptions }, date, date);
  const occurrenceKey = `${date}|${rule.id}`;
  const involves = (conflict: ScheduleConflict): boolean =>
    conflict.occurrenceKeys.includes(occurrenceKey);
  const errors = relevantNewConflicts(before.conflicts, after.conflicts, involves);
  if (errors.length > 0) {
    throw AppError.conflict('La modificación de esta fecha genera conflictos nuevos.', {
      conflicts: errors,
    });
  }
  const warnings = newWarnings(before.conflicts, after.conflicts, involves);

  if (existing) {
    await tx.repo('scheduleExceptions').update(existing.id, exception);
  } else {
    await tx.repo('scheduleExceptions').insert(exception);
  }

  const updatedOccurrence = after.occurrences.find(
    (item) => item.ruleId === rule.id && item.date === date,
  );
  if (updatedOccurrence) {
    await reconcileIssuesTx(tx, updatedOccurrence);
  }

  if (!options.skipAudit) {
    await audit.record(
      {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        action: 'schedule.change_date',
        entity: 'scheduleException',
        entityId: exception.id,
        metadata: {
          scheduleRuleId: rule.id,
          date,
          startMinute,
          endMinute,
          segmentCount: segments.length,
          reason: exception.reason,
        },
      },
      tx,
    );
  }
  return { rule, exception, warnings };
}
