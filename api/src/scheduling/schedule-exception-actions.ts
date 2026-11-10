import {
  type CreateScheduleExceptionInput,
  type ScheduleConflict,
  type ScheduleException,
  type ScheduleSegmentInput,
  type SessionUser,
  type UpdateScheduleExceptionInput,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { AuditService } from '../audit/audit.service';
import { loadSchedulingContext } from './context';
import { buildScheduleView, relevantNewConflicts } from './engine';
import type { SchedulingContext } from './scheduling.types';
import type { ScheduleService } from './schedule.service';

export class ScheduleExceptionActions {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly changes: Pick<ScheduleService, 'applyDateChangeTx' | 'applyCancellationTx'>,
  ) {}
  async createException(
    actor: SessionUser,
    input: CreateScheduleExceptionInput,
  ): Promise<{ exception: ScheduleException; warnings: ScheduleConflict[] }> {
    return this.store.transaction(async (tx) => {
      const rule = await tx.repo('scheduleRules').findById(input.scheduleRuleId);
      if (!rule) throw AppError.notFound('Jornada');
      if (input.type === 'cancelled') {
        const exception = await this.changes.applyCancellationTx(
          tx,
          actor,
          rule,
          input.date,
          input.reason ?? null,
        );
        return { exception, warnings: [] };
      }
      const result = await this.changes.applyDateChangeTx(tx, actor, rule, input.date, {
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        segments: input.segments,
        reason: input.reason,
      });
      return { exception: result.exception, warnings: result.warnings };
    });
  }

  async updateException(
    actor: SessionUser,
    id: string,
    input: UpdateScheduleExceptionInput,
  ): Promise<{ exception: ScheduleException; warnings: ScheduleConflict[] }> {
    return this.store.transaction(async (tx) => {
      const exception = await tx.repo('scheduleExceptions').findById(id);
      if (!exception) throw AppError.notFound('Excepción');
      const rule = await tx.repo('scheduleRules').findById(exception.scheduleRuleId);
      if (!rule) throw AppError.notFound('Jornada');

      if (input.type === 'cancelled') {
        const updated = await this.changes.applyCancellationTx(
          tx,
          actor,
          rule,
          exception.date,
          input.reason ?? exception.reason ?? null,
        );
        return { exception: updated, warnings: [] };
      }

      if (exception.type === 'cancelled') {
        if (!input.segments || input.startMinute === undefined || input.endMinute === undefined) {
          throw AppError.validation(
            'Para convertir una cancelación en una fecha modificada, indicá horario y tramos.',
          );
        }
        const result = await this.changes.applyDateChangeTx(tx, actor, rule, exception.date, {
          startMinute: input.startMinute,
          endMinute: input.endMinute,
          segments: input.segments,
          reason: input.reason ?? exception.reason ?? undefined,
        });
        return { exception: result.exception, warnings: result.warnings };
      }

      const result = await this.changes.applyDateChangeTx(tx, actor, rule, exception.date, {
        startMinute: input.startMinute ?? exception.startMinute ?? undefined,
        endMinute: input.endMinute ?? exception.endMinute ?? undefined,
        segments:
          input.segments ??
          (exception.segments as unknown as ScheduleSegmentInput[] | undefined) ??
          undefined,
        reason: input.reason ?? exception.reason ?? undefined,
      });
      return { exception: result.exception, warnings: result.warnings };
    });
  }

  async removeException(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const exception = await tx.repo('scheduleExceptions').findById(id);
      if (!exception) throw AppError.notFound('Excepción');
      const rule = await tx.repo('scheduleRules').findById(exception.scheduleRuleId);
      if (!rule) throw AppError.notFound('Jornada');

      const beforeCtx = await loadSchedulingContext(tx);
      const before = buildScheduleView(beforeCtx, exception.date, exception.date);
      const afterCtx: SchedulingContext = {
        ...beforeCtx,
        exceptions: beforeCtx.exceptions.filter((item) => item.id !== id),
      };
      const after = buildScheduleView(afterCtx, exception.date, exception.date);
      const occurrenceKey = `${exception.date}|${rule.id}`;
      const errors = relevantNewConflicts(before.conflicts, after.conflicts, (conflict) =>
        conflict.occurrenceKeys.includes(occurrenceKey),
      );
      if (errors.length > 0) {
        throw AppError.conflict(
          'Al quitar la excepción se reactiva la jornada original y se generan conflictos.',
          { conflicts: errors },
        );
      }

      await tx.repo('scheduleExceptions').remove(id);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'schedule.exception_remove',
          entity: 'scheduleException',
          entityId: id,
          metadata: {
            scheduleRuleId: rule.id,
            date: exception.date,
            type: exception.type,
          },
        },
        tx,
      );
      return { removed: true };
    });
  }
}
