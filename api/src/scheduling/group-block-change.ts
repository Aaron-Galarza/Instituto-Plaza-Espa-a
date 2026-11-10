import { randomUUID } from 'node:crypto';
import {
  validateRuleShape,
  type ChangeGroupBlockInput,
  type ScheduleConflict,
  type ScheduleException,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { buildScheduleView, expandOccurrences, relevantNewConflicts } from './engine';
import { reconcileIssuesTx } from './schedule-issue-reconciliation';
import { newWarnings } from './schedule-validation';
import type { SchedulingContext } from './scheduling.types';

export async function changeGroupBlock(
  store: DataStore,
  audit: AuditService,
  actor: SessionUser,
  input: ChangeGroupBlockInput,
): Promise<{ changed: number; warnings: ScheduleConflict[] }> {
  return store.transaction(async (tx) => {
    const ctx = await loadSchedulingContext(tx);
    const group = ctx.groups.find((item) => item.id === input.groupId);
    if (!group || group.status !== 'active') {
      throw AppError.validation('El grupo no existe o está inactivo.');
    }
    if (input.professionalIds.some((id) => !group.professionalIds.includes(id))) {
      throw AppError.validation('Los profesionales elegidos deben pertenecer al grupo.');
    }
    if (group.spaceId && group.spaceId !== input.spaceId) {
      throw AppError.validation('Este grupo tiene un espacio fijo diferente.');
    }
    const occurrences = expandOccurrences(ctx, input.date, input.date).filter(
      (item) =>
        item.status !== 'cancelled' &&
        item.segments.some(
          (segment) =>
            segment.groupId === input.groupId &&
            segment.startMinute === input.sourceStartMinute &&
            segment.endMinute === input.sourceEndMinute,
        ),
    );
    if (!occurrences.length) throw AppError.notFound('Bloque grupal');
    const now = new Date().toISOString();
    const replacements: ScheduleException[] = [];
    for (const occurrence of occurrences) {
      const rule = ctx.rules.find((item) => item.id === occurrence.ruleId)!;
      if (input.expectedRuleVersions[rule.id] !== rule.version) {
        throw AppError.staleWrite();
      }
      const prior = ctx.exceptions.find(
        (item) => item.scheduleRuleId === rule.id && item.date === input.date,
      );
      const baseSegments =
        prior?.type === 'modified' && prior.segments?.length ? prior.segments : rule.segments;
      const segments = baseSegments.map((segment) =>
        segment.groupId === input.groupId &&
        segment.startMinute === input.sourceStartMinute &&
        segment.endMinute === input.sourceEndMinute
          ? {
              ...segment,
              startMinute: input.startMinute,
              endMinute: input.endMinute,
              professionalIds: [...input.professionalIds],
              spaceId: input.spaceId,
            }
          : segment,
      );
      const startMinute = Math.min(...segments.map((segment) => segment.startMinute));
      const endMinute = Math.max(...segments.map((segment) => segment.endMinute));
      const shapeIssues = validateRuleShape({ startMinute, endMinute, segments });
      if (shapeIssues.length) {
        throw AppError.validation(
          'El cambio grupal se superpone con otro tramo de una jornada.',
          shapeIssues,
        );
      }
      replacements.push({
        id: prior?.id ?? randomUUID(),
        scheduleRuleId: rule.id,
        date: input.date,
        type: 'modified',
        startMinute,
        endMinute,
        segments,
        reason: input.reason,
        createdBy: prior?.createdBy ?? actor.id,
        createdAt: prior?.createdAt ?? now,
        updatedAt: now,
      });
    }
    const before = buildScheduleView(ctx, input.date, input.date);
    const replacedIds = new Set(replacements.map((item) => item.scheduleRuleId));
    const afterCtx: SchedulingContext = {
      ...ctx,
      exceptions: [
        ...ctx.exceptions.filter(
          (item) => !(item.date === input.date && replacedIds.has(item.scheduleRuleId)),
        ),
        ...replacements,
      ],
    };
    const after = buildScheduleView(afterCtx, input.date, input.date);
    const involves = (conflict: ScheduleConflict) =>
      conflict.ruleIds.some((id) => replacedIds.has(id));
    const errors = relevantNewConflicts(before.conflicts, after.conflicts, involves);
    if (errors.length) {
      throw AppError.conflict('El cambio del bloque grupal genera conflictos nuevos.', {
        conflicts: errors,
      });
    }
    const warnings = newWarnings(before.conflicts, after.conflicts, involves);
    for (const exception of replacements) {
      const prior = ctx.exceptions.find((item) => item.id === exception.id);
      if (prior) await tx.repo('scheduleExceptions').update(prior.id, exception);
      else await tx.repo('scheduleExceptions').insert(exception);
      const updatedOccurrence = after.occurrences.find(
        (item) => item.ruleId === exception.scheduleRuleId,
      );
      if (updatedOccurrence) await reconcileIssuesTx(tx, updatedOccurrence);
    }
    await audit.record(
      {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        action: 'schedule.change_group_block',
        entity: 'careGroup',
        entityId: input.groupId,
        metadata: {
          date: input.date,
          affectedJourneys: replacements.length,
          reason: input.reason,
        },
      },
      tx,
    );
    return { changed: replacements.length, warnings };
  });
}
