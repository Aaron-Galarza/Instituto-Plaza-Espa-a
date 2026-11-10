import { randomUUID } from 'node:crypto';
import {
  type ScheduleConflict,
  type ScheduleRule,
  type ScheduleValidationResponse,
  type ValidateScheduleRuleInput,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { buildScheduleView } from './engine';
import { prepareRuleInput } from './schedule-rule-input';
import { validationWindow } from './schedule-validation';

export async function validateDraft(
  store: DataStore,
  input: ValidateScheduleRuleInput,
): Promise<ScheduleValidationResponse> {
  return store.transaction(async (tx) => {
    const existing = input.ruleId ? await tx.repo('scheduleRules').findById(input.ruleId) : null;
    if (input.ruleId && !existing) throw AppError.notFound('Jornada');

    const prepared = await prepareRuleInput(tx, input.rule);
    const now = new Date().toISOString();
    const rule: ScheduleRule = {
      id: existing?.id ?? `draft-${randomUUID()}`,
      seriesId: existing?.seriesId ?? randomUUID(),
      version: existing?.version ?? 1,
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
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const ctx = await loadSchedulingContext(tx);
    const rules = existing
      ? ctx.rules.map((item) => (item.id === existing.id ? rule : item))
      : [...ctx.rules, rule];
    const window = validationWindow(rule);
    const view = window
      ? buildScheduleView({ ...ctx, rules }, window.from, window.to)
      : { occurrences: [], conflicts: [] };
    const involves = (conflict: ScheduleConflict): boolean =>
      conflict.ruleIds.includes(rule.id) ||
      conflict.occurrenceKeys.some((key) => key.endsWith(`|${rule.id}`));
    const errors = view.conflicts.filter(
      (conflict) => conflict.severity === 'error' && involves(conflict),
    );
    const warnings = view.conflicts.filter(
      (conflict) => conflict.severity === 'warning' && involves(conflict),
    );
    return { errors, warnings, valid: errors.length === 0 };
  });
}
