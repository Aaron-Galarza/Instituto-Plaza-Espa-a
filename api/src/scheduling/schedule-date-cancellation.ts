import { randomUUID } from 'node:crypto';
import { type ScheduleException, type ScheduleRule, type SessionUser } from '@plaza/shared';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { assertOccurrenceDate } from './schedule-validation';

export async function applyCancellation(
  tx: DataStore,
  actor: SessionUser,
  rule: ScheduleRule,
  date: string,
  reason: string | null,
  options: { skipAudit?: boolean } = {},
  audit: AuditService,
): Promise<ScheduleException> {
  assertOccurrenceDate(rule, date);
  const existing = await tx
    .repo('scheduleExceptions')
    .findOne((exception) => exception.scheduleRuleId === rule.id && exception.date === date);
  const now = new Date().toISOString();
  const exception: ScheduleException = {
    id: existing?.id ?? randomUUID(),
    scheduleRuleId: rule.id,
    date,
    type: 'cancelled',
    startMinute: null,
    endMinute: null,
    segments: undefined,
    reason,
    createdBy: existing?.createdBy ?? actor.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing) {
    await tx.repo('scheduleExceptions').update(existing.id, exception);
  } else {
    await tx.repo('scheduleExceptions').insert(exception);
  }

  const pending = await tx
    .repo('assignmentIssues')
    .where(
      (issue) =>
        issue.scheduleRuleId === rule.id && issue.date === date && issue.status === 'pending',
    );
  for (const issue of pending) {
    await tx.repo('assignmentIssues').update(issue.id, {
      status: 'resolved',
      resolution: 'La fecha fue cancelada; la afectación dejó de existir.',
      resolvedAt: new Date().toISOString(),
    });
  }

  if (!options.skipAudit) {
    await audit.record(
      {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        action: 'schedule.change_date',
        entity: 'scheduleException',
        entityId: exception.id,
        metadata: { scheduleRuleId: rule.id, date, type: 'cancelled', reason },
      },
      tx,
    );
  }
  return exception;
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
