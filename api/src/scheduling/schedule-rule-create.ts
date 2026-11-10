import { randomUUID } from 'node:crypto';
import {
  type CreateRuleResponse,
  type CreateScheduleRuleInput,
  type ScheduleConflict,
  type ScheduleRule,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { buildScheduleView, relevantNewConflicts } from './engine';
import { prepareRuleInput } from './schedule-rule-input';
import { validationWindow, newWarnings } from './schedule-validation';
import type { SchedulingContext } from './scheduling.types';

export async function createRuleTx(
  audit: AuditService,
  tx: DataStore,
  actor: SessionUser,
  input: CreateScheduleRuleInput,
): Promise<CreateRuleResponse> {
  const prepared = await prepareRuleInput(tx, input);
  const now = new Date().toISOString();
  const rule: ScheduleRule = {
    id: randomUUID(),
    seriesId: randomUUID(),
    version: 1,
    patientId: prepared.patientId,
    daysOfWeek: prepared.daysOfWeek,
    effectiveFrom: prepared.effectiveFrom,
    effectiveTo: prepared.effectiveTo,
    startMinute: prepared.startMinute,
    endMinute: prepared.endMinute,
    segments: prepared.segments,
    notes: prepared.notes,
    status: 'active',
    supersedesId: null,
    createdAt: now,
    updatedAt: now,
  };

  const beforeCtx = await loadSchedulingContext(tx);
  const window = validationWindow(rule);
  const before = window
    ? buildScheduleView(beforeCtx, window.from, window.to)
    : { occurrences: [], conflicts: [] };
  const afterCtx: SchedulingContext = { ...beforeCtx, rules: [...beforeCtx.rules, rule] };
  const after = window
    ? buildScheduleView(afterCtx, window.from, window.to)
    : { occurrences: [], conflicts: [] };

  const involvesNew = (conflict: ScheduleConflict): boolean =>
    conflict.ruleIds.includes(rule.id) ||
    conflict.occurrenceKeys.some((key) => key.endsWith(`|${rule.id}`));
  const errors = relevantNewConflicts(before.conflicts, after.conflicts, involvesNew);
  if (errors.length > 0) {
    throw AppError.conflict(
      'La jornada genera conflictos que deben resolverse antes de guardarla.',
      { conflicts: errors },
    );
  }
  const warnings = newWarnings(before.conflicts, after.conflicts, involvesNew);

  const saved = await tx.repo('scheduleRules').insert(rule);
  await audit.record(
    {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      action: 'schedule.create',
      entity: 'scheduleRule',
      entityId: saved.id,
      metadata: {
        patientId: saved.patientId,
        daysOfWeek: saved.daysOfWeek,
        effectiveFrom: saved.effectiveFrom,
        effectiveTo: saved.effectiveTo,
        segmentCount: saved.segments.length,
      },
    },
    tx,
  );
  return { rule: saved, warnings };
}
