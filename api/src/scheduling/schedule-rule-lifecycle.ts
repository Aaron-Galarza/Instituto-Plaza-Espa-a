import { todayInInstitutionTz, type ScheduleRule, type SessionUser } from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';

export class ScheduleRuleLifecycle {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}
  async finishRule(
    actor: SessionUser,
    id: string,
    lastDate: string,
    reason: string,
  ): Promise<ScheduleRule> {
    return this.store.transaction(async (tx) => {
      const rule = await tx.repo('scheduleRules').findById(id);
      if (!rule) throw AppError.notFound('Jornada');
      if (rule.status !== 'active') throw AppError.conflict('La recurrencia no está activa.');
      if (lastDate < rule.effectiveFrom) {
        throw AppError.validation(
          'La fecha de fin es anterior al inicio. Si deseás cancelar toda la serie, usá "Cancelar serie".',
        );
      }
      if (rule.effectiveTo && lastDate > rule.effectiveTo) {
        throw AppError.validation('La recurrencia ya finaliza antes de esa fecha.');
      }
      const updated = await tx.repo('scheduleRules').update(id, {
        effectiveTo: lastDate,
        status: lastDate < todayInInstitutionTz() ? 'finished' : 'active',
      });
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'schedule.finish',
          entity: 'scheduleRule',
          entityId: id,
          metadata: { lastDate, reason },
        },
        tx,
      );
      return updated;
    });
  }

  async cancelRule(actor: SessionUser, id: string, reason: string): Promise<ScheduleRule> {
    return this.store.transaction(async (tx) => {
      const rule = await tx.repo('scheduleRules').findById(id);
      if (!rule) throw AppError.notFound('Jornada');
      if (rule.status === 'cancelled') return rule;
      const updated = await tx.repo('scheduleRules').update(id, { status: 'cancelled' });
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'schedule.cancel',
          entity: 'scheduleRule',
          entityId: id,
          metadata: { reason, seriesId: rule.seriesId },
        },
        tx,
      );
      return updated;
    });
  }

  async deleteRule(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const rule = await tx.repo('scheduleRules').findById(id);
      if (!rule) throw AppError.notFound('Jornada');
      const safe =
        rule.version === 1 &&
        rule.status === 'active' &&
        rule.effectiveFrom > todayInInstitutionTz() &&
        (await tx
          .repo('scheduleExceptions')
          .count((exception) => exception.scheduleRuleId === id)) === 0 &&
        (await tx.repo('assignmentIssues').count((issue) => issue.scheduleRuleId === id)) === 0;
      if (!safe) {
        throw AppError.reference(
          'La jornada ya tiene vigencia o historial. Usá "Cancelar serie" o "Finalizar recurrencia" en lugar de eliminarla.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'schedule.cancel',
          entity: 'scheduleRule',
          entityId: id,
          metadata: { removed: true, reason: 'Eliminación de recurrencia futura sin historial' },
        },
        tx,
      );
      await tx.repo('scheduleRules').remove(id);
      return { removed: true };
    });
  }
}
