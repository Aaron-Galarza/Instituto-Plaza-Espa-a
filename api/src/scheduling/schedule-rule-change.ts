import { randomUUID } from 'node:crypto';
import {
  addDays,
  type ChangeRuleResponse,
  type ChangeScheduleRuleInput,
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
import { applyDateChange } from './schedule-date-change';
import { assertFutureRuleDate, validationWindow, newWarnings } from './schedule-validation';
import { changeWeekdayFutureTx } from './schedule-weekday-change';
import type { SchedulingContext } from './scheduling.types';

export async function changeRule(
  store: DataStore,
  audit: AuditService,
  actor: SessionUser,
  id: string,
  input: ChangeScheduleRuleInput,
): Promise<ChangeRuleResponse> {
  return store.transaction(async (tx) => {
    const rule = await tx.repo('scheduleRules').findById(id);
    if (!rule) throw AppError.notFound('Jornada');
    if (rule.version !== input.expectedVersion) throw AppError.staleWrite();

    if (input.scope === 'date') {
      const result = await applyDateChange(tx, actor, rule, input.date, input.changes, {}, audit);
      return {
        rule: result.rule,
        exception: result.exception,
        warnings: result.warnings,
      };
    }

    if (input.scope === 'weekday_future') {
      return changeWeekdayFutureTx(audit, tx, actor, rule, input.date, input.changes);
    }

    assertFutureRuleDate(rule, input);

    const merged = await prepareMergedRule(tx, rule, {
      ...input.changes,
      effectiveFrom: input.date,
    });
    const window = validationWindow(merged);
    await assertGroupedFutureCompatibleTx(tx, rule, { ...rule, ...merged }, window);
    const beforeCtx = await loadSchedulingContext(tx);
    const before = window
      ? buildScheduleView(beforeCtx, window.from, window.to)
      : { occurrences: [], conflicts: [] };

    if (input.date <= rule.effectiveFrom) {
      const updatedRule: ScheduleRule = {
        ...rule,
        ...merged,
        version: rule.version + 1,
        seriesId: rule.seriesId,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      const afterCtx: SchedulingContext = {
        ...beforeCtx,
        rules: beforeCtx.rules.map((item) => (item.id === id ? updatedRule : item)),
      };
      const after = window
        ? buildScheduleView(afterCtx, window.from, window.to)
        : { occurrences: [], conflicts: [] };
      const involvesRule = (conflict: ScheduleConflict): boolean =>
        conflict.ruleIds.includes(id) ||
        conflict.occurrenceKeys.some((key) => key.endsWith(`|${id}`));
      const errors = relevantNewConflicts(before.conflicts, after.conflicts, involvesRule);
      if (errors.length > 0) {
        throw AppError.conflict('El cambio genera conflictos nuevos.', { conflicts: errors });
      }
      const warnings = newWarnings(before.conflicts, after.conflicts, involvesRule);
      const saved = await tx.repo('scheduleRules').update(id, updatedRule);
      await audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'schedule.change_future',
          entity: 'scheduleRule',
          entityId: id,
          metadata: {
            mode: 'in-place',
            date: input.date,
            fromVersion: rule.version,
            toVersion: saved.version,
          },
        },
        tx,
      );
      return { rule: saved, exception: null, warnings };
    }

    const now = new Date().toISOString();
    const newRule: ScheduleRule = {
      id: randomUUID(),
      seriesId: rule.seriesId,
      version: rule.version + 1,
      patientId: merged.patientId,
      daysOfWeek: merged.daysOfWeek,
      effectiveFrom: input.date,
      effectiveTo: merged.effectiveTo,
      startMinute: merged.startMinute,
      endMinute: merged.endMinute,
      segments: merged.segments,
      notes: merged.notes,
      status: 'active',
      supersedesId: rule.id,
      createdAt: now,
      updatedAt: now,
    };
    if (newRule.effectiveTo && newRule.effectiveTo < newRule.effectiveFrom) {
      throw AppError.validation('La vigencia de la nueva versión quedaría antes de su inicio.');
    }

    const oldRule: ScheduleRule = {
      ...rule,
      effectiveTo: addDays(input.date, -1),
      updatedAt: now,
    };
    const afterCtx: SchedulingContext = {
      ...beforeCtx,
      rules: [...beforeCtx.rules.filter((item) => item.id !== id), oldRule, newRule],
      exceptions: beforeCtx.exceptions.map((exception) =>
        exception.scheduleRuleId === id && exception.date >= input.date
          ? { ...exception, scheduleRuleId: newRule.id }
          : exception,
      ),
      issues: beforeCtx.issues.map((issue) =>
        issue.scheduleRuleId === id && issue.date >= input.date && issue.status === 'pending'
          ? { ...issue, scheduleRuleId: newRule.id }
          : issue,
      ),
    };
    const after = window
      ? buildScheduleView(afterCtx, window.from, window.to)
      : { occurrences: [], conflicts: [] };
    const involvesNewVersion = (conflict: ScheduleConflict): boolean =>
      conflict.ruleIds.includes(newRule.id) ||
      conflict.occurrenceKeys.some((key) => key.endsWith(`|${newRule.id}`));
    const errors = relevantNewConflicts(before.conflicts, after.conflicts, involvesNewVersion);
    if (errors.length > 0) {
      throw AppError.conflict('El cambio de serie genera conflictos nuevos.', {
        conflicts: errors,
      });
    }
    const warnings = newWarnings(before.conflicts, after.conflicts, involvesNewVersion);

    await tx.repo('scheduleRules').update(id, {
      effectiveTo: oldRule.effectiveTo,
    });
    const saved = await tx.repo('scheduleRules').insert(newRule);

    const migratedExceptions = beforeCtx.exceptions.filter(
      (exception) => exception.scheduleRuleId === id && exception.date >= input.date,
    );
    for (const exception of migratedExceptions) {
      await tx.repo('scheduleExceptions').update(exception.id, {
        scheduleRuleId: newRule.id,
      });
    }
    const migratedIssues = beforeCtx.issues.filter(
      (issue) =>
        issue.scheduleRuleId === id && issue.date >= input.date && issue.status === 'pending',
    );
    for (const issue of migratedIssues) {
      await tx.repo('assignmentIssues').update(issue.id, {
        scheduleRuleId: newRule.id,
      });
    }

    await audit.record(
      {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        action: 'schedule.change_future',
        entity: 'scheduleRule',
        entityId: saved.id,
        metadata: {
          previousRuleId: rule.id,
          seriesId: rule.seriesId,
          version: saved.version,
          effectiveFrom: saved.effectiveFrom,
          effectiveTo: saved.effectiveTo,
          migratedExceptions: migratedExceptions.length,
        },
      },
      tx,
    );
    return { rule: saved, exception: null, warnings };
  });
}
