import { randomUUID } from 'node:crypto';
import {
  addDays,
  isoWeekday,
  type ChangeRuleResponse,
  type FutureRulePatch,
  type ScheduleConflict,
  type ScheduleRule,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { buildScheduleView, relevantNewConflicts } from './engine';
import { assertGroupedFutureCompatibleTx } from './group-session-validation';
import { prepareMergedRule } from './schedule-rule-input';
import { assertOccurrenceDate, validationWindow, newWarnings } from './schedule-validation';
import type { SchedulingContext } from './scheduling.types';

export async function changeWeekdayFutureTx(
  audit: AuditService,
  tx: DataStore,
  actor: SessionUser,
  rule: ScheduleRule,
  date: string,
  changes: FutureRulePatch,
): Promise<ChangeRuleResponse> {
  assertOccurrenceDate(rule, date);
  if (rule.daysOfWeek.length < 2) {
    throw AppError.validation(
      'La recurrencia tiene un solo día semanal; usá cambiar toda la recurrencia.',
    );
  }
  const weekday = isoWeekday(date);
  if (
    changes.daysOfWeek &&
    (changes.daysOfWeek.length !== 1 || changes.daysOfWeek[0] !== weekday)
  ) {
    throw AppError.validation('Este cambio solo puede conservar el día semanal seleccionado.');
  }
  if (changes.effectiveFrom !== undefined && changes.effectiveFrom !== date) {
    throw AppError.validation('La nueva vigencia debe empezar en la fecha seleccionada.');
  }
  const merged = await prepareMergedRule(tx, rule, {
    ...changes,
    daysOfWeek: [weekday],
    effectiveFrom: date,
  });
  const now = new Date().toISOString();
  const atBeginning = date === rule.effectiveFrom;
  const remaining = rule.daysOfWeek.filter((day) => day !== weekday);
  const selected: ScheduleRule = {
    ...rule,
    ...merged,
    id: randomUUID(),
    seriesId: atBeginning ? randomUUID() : rule.seriesId,
    version: atBeginning ? 1 : rule.version + 1,
    daysOfWeek: [weekday],
    supersedesId: atBeginning ? null : rule.id,
    createdAt: now,
    updatedAt: now,
  };
  const companion: ScheduleRule = {
    ...rule,
    id: atBeginning ? rule.id : randomUUID(),
    seriesId: atBeginning ? rule.seriesId : randomUUID(),
    version: atBeginning ? rule.version + 1 : 1,
    daysOfWeek: remaining,
    effectiveFrom: date,
    supersedesId: atBeginning ? rule.supersedesId : rule.id,
    createdAt: atBeginning ? rule.createdAt : now,
    updatedAt: now,
  };
  const oldRule: ScheduleRule | null = atBeginning
    ? null
    : { ...rule, effectiveTo: addDays(date, -1), updatedAt: now };
  const beforeCtx = await loadSchedulingContext(tx);
  const migrateTo = (itemDate: string): string =>
    itemDate >= date && isoWeekday(itemDate) === weekday ? selected.id : companion.id;
  const afterCtx: SchedulingContext = {
    ...beforeCtx,
    rules: [
      ...beforeCtx.rules.filter((item) => item.id !== rule.id),
      ...(oldRule ? [oldRule] : []),
      companion,
      selected,
    ],
    exceptions: beforeCtx.exceptions.map((item) =>
      item.scheduleRuleId === rule.id && item.date >= date
        ? { ...item, scheduleRuleId: migrateTo(item.date) }
        : item,
    ),
    issues: beforeCtx.issues.map((item) =>
      item.scheduleRuleId === rule.id && item.date >= date && item.status === 'pending'
        ? { ...item, scheduleRuleId: migrateTo(item.date) }
        : item,
    ),
  };
  const window = validationWindow(selected);
  await assertGroupedFutureCompatibleTx(tx, rule, selected, window);
  const before = window
    ? buildScheduleView(beforeCtx, window.from, window.to)
    : { conflicts: [] as ScheduleConflict[] };
  const after = window
    ? buildScheduleView(afterCtx, window.from, window.to)
    : { conflicts: [] as ScheduleConflict[] };
  const affectsSelected = (conflict: ScheduleConflict) => conflict.ruleIds.includes(selected.id);
  const errors = relevantNewConflicts(before.conflicts, after.conflicts, affectsSelected);
  if (errors.length) {
    throw AppError.conflict('El cambio de este día semanal genera conflictos nuevos.', {
      conflicts: errors,
    });
  }
  const warnings = newWarnings(before.conflicts, after.conflicts, affectsSelected);
  if (atBeginning) {
    await tx.repo('scheduleRules').update(rule.id, companion);
  } else {
    await tx.repo('scheduleRules').update(rule.id, { effectiveTo: oldRule!.effectiveTo });
    await tx.repo('scheduleRules').insert(companion);
  }
  const saved = await tx.repo('scheduleRules').insert(selected);
  for (const item of beforeCtx.exceptions) {
    if (item.scheduleRuleId === rule.id && item.date >= date) {
      await tx.repo('scheduleExceptions').update(item.id, {
        scheduleRuleId: migrateTo(item.date),
      });
    }
  }
  for (const item of beforeCtx.issues) {
    if (item.scheduleRuleId === rule.id && item.date >= date && item.status === 'pending') {
      await tx.repo('assignmentIssues').update(item.id, {
        scheduleRuleId: migrateTo(item.date),
      });
    }
  }
  await audit.record(
    {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      action: 'schedule.change_weekday_future',
      entity: 'scheduleRule',
      entityId: saved.id,
      metadata: { originalRuleId: rule.id, companionRuleId: companion.id, date, weekday },
    },
    tx,
  );
  return { rule: saved, exception: null, warnings };
}
