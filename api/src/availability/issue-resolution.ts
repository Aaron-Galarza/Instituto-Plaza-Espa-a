import {
  type AssignmentIssueDetail,
  type ResolveIssueInput,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { expandOccurrences } from '../scheduling/engine';
import { ScheduleService } from '../scheduling/schedule.service';
import { decorateIssues } from './availability-issue-details';
import { rescheduleIssue } from './issue-reschedule';

export class IssueResolution {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly schedule: ScheduleService,
  ) {}
  async resolveIssue(
    actor: SessionUser,
    issueId: string,
    input: ResolveIssueInput,
  ): Promise<AssignmentIssueDetail> {
    return this.store.transaction(async (tx) => {
      const issue = await tx.repo('assignmentIssues').findById(issueId);
      if (!issue) throw AppError.notFound('Afectación');
      if (issue.status !== 'pending') {
        throw AppError.conflict('La afectación ya fue resuelta.');
      }
      const rule = await tx.repo('scheduleRules').findById(issue.scheduleRuleId);
      if (!rule) throw AppError.notFound('Jornada');
      if (
        'expectedVersion' in input &&
        input.expectedVersion !== undefined &&
        rule.version !== input.expectedVersion
      ) {
        throw AppError.staleWrite();
      }

      if (input.action === 'dismiss') {
        const updated = await tx.repo('assignmentIssues').update(issueId, {
          status: 'dismissed',
          resolution: input.reason,
          resolvedBy: actor.id,
          resolvedAt: new Date().toISOString(),
        });
        await this.audit.record(
          {
            actor: { id: actor.id, name: actor.name, role: actor.role },
            action: 'issue.dismiss',
            entity: 'assignmentIssue',
            entityId: issueId,
            metadata: { reason: input.reason, ruleId: rule.id, date: issue.date },
          },
          tx,
        );
        return (await decorateIssues(tx, [updated]))[0]!;
      }

      if (input.action === 'cancel_date') {
        await this.schedule.applyCancellationTx(tx, actor, rule, issue.date, input.reason);
        const updated = await tx.repo('assignmentIssues').update(issueId, {
          status: 'resolved',
          resolution: `Fecha cancelada. ${input.reason}`,
          resolvedBy: actor.id,
          resolvedAt: new Date().toISOString(),
        });
        await this.audit.record(
          {
            actor: { id: actor.id, name: actor.name, role: actor.role },
            action: 'issue.cancel_date',
            entity: 'assignmentIssue',
            entityId: issueId,
            metadata: { reason: input.reason, ruleId: rule.id, date: issue.date },
          },
          tx,
        );
        return (await decorateIssues(tx, [updated]))[0]!;
      }

      if (input.action === 'reschedule') {
        return rescheduleIssue(tx, this.audit, this.schedule, actor, issue, rule, input);
      }

      // Reasignación: sólo cambia la fecha afectada, con validación completa.
      const newProfessional = await tx.repo('professionals').findById(input.professionalId);
      if (!newProfessional) throw AppError.validation('El profesional indicado no existe.');
      if (newProfessional.status !== 'active') {
        throw AppError.validation('El profesional indicado está inactivo.');
      }
      if (newProfessional.id === issue.professionalId) {
        throw AppError.validation('Seleccioná un profesional diferente al ausente.');
      }

      const ctx = await loadSchedulingContext(tx);
      const occurrence = expandOccurrences(ctx, issue.date, issue.date).find(
        (item) => item.ruleId === rule.id,
      );
      if (!occurrence) throw AppError.conflict('La fecha ya no tiene una jornada programada.');

      const segments = occurrence.segments.map((segment) => ({
        id: segment.id,
        serviceId: segment.serviceId,
        professionalIds: issue.segmentIds.includes(segment.id)
          ? segment.professionalIds.map((professionalId) =>
              professionalId === issue.professionalId ? input.professionalId : professionalId,
            )
          : segment.professionalIds,
        groupId: segment.groupId ?? undefined,
        spaceId: segment.spaceId ?? undefined,
        startMinute: segment.startMinute,
        endMinute: segment.endMinute,
        modality: segment.modality as 'individual' | 'group' | 'shared',
        notes: segment.notes ?? undefined,
      }));

      await this.schedule.applyDateChangeTx(
        tx,
        actor,
        rule,
        issue.date,
        {
          startMinute: occurrence.startMinute,
          endMinute: occurrence.endMinute,
          segments,
          reason: `Reasignación por ausencia: ${input.reason}`,
        },
        { skipAudit: true },
      );

      const updated = await tx.repo('assignmentIssues').update(issueId, {
        status: 'resolved',
        resolution: `Reasignado a ${newProfessional.firstName} ${newProfessional.lastName}. ${input.reason}`,
        resolvedBy: actor.id,
        resolvedAt: new Date().toISOString(),
      });
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'issue.reassign',
          entity: 'assignmentIssue',
          entityId: issueId,
          metadata: {
            reason: input.reason,
            ruleId: rule.id,
            date: issue.date,
            fromProfessionalId: issue.professionalId,
            toProfessionalId: input.professionalId,
          },
        },
        tx,
      );
      return (await decorateIssues(tx, [updated]))[0]!;
    });
  }
}
