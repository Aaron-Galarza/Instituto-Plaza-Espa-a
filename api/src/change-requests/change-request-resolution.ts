import {
  type CancelChangeRequestInput,
  type ChangeRequest,
  type ResolveChangeRequestInput,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { ScheduleService } from '../scheduling/schedule.service';
import { applyProposal } from './change-request-apply';

export class ChangeRequestResolution {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly schedule: ScheduleService,
  ) {}
  async approve(
    actor: SessionUser,
    id: string,
    input: ResolveChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.store.transaction(async (tx) => {
      const request = await tx.repo('changeRequests').findById(id);
      if (!request) throw AppError.notFound('Solicitud');
      if (request.status !== 'pending') {
        throw AppError.conflict('La solicitud ya fue resuelta.');
      }
      if (request.version !== input.expectedVersion) throw AppError.staleWrite();
      const rule = await tx.repo('scheduleRules').findById(request.resourceId);
      if (!rule) throw AppError.notFound('Jornada');

      await applyProposal(this.schedule, tx, actor, request, rule);
      const updated = await tx.repo('changeRequests').update(
        id,
        {
          status: 'approved',
          resolutionNote: input.note,
          resolvedBy: actor.id,
          resolvedByName: actor.name,
          resolvedAt: new Date().toISOString(),
          version: request.version + 1,
        },
        request.version,
      );
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'request.approve',
          entity: 'changeRequest',
          entityId: id,
          metadata: {
            type: request.type,
            scheduleRuleId: rule.id,
            date: request.proposal.date,
            requesterId: request.requesterId,
            note: input.note,
          },
        },
        tx,
      );
      return updated;
    });
  }

  async reject(
    actor: SessionUser,
    id: string,
    input: ResolveChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.store.transaction(async (tx) => {
      const request = await tx.repo('changeRequests').findById(id);
      if (!request) throw AppError.notFound('Solicitud');
      if (request.status !== 'pending') {
        throw AppError.conflict('La solicitud ya fue resuelta.');
      }
      if (request.version !== input.expectedVersion) throw AppError.staleWrite();
      const updated = await tx.repo('changeRequests').update(
        id,
        {
          status: 'rejected',
          resolutionNote: input.note,
          resolvedBy: actor.id,
          resolvedByName: actor.name,
          resolvedAt: new Date().toISOString(),
          version: request.version + 1,
        },
        request.version,
      );
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'request.reject',
          entity: 'changeRequest',
          entityId: id,
          metadata: { type: request.type, note: input.note },
        },
        tx,
      );
      return updated;
    });
  }

  async cancel(
    actor: SessionUser,
    id: string,
    input: CancelChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.store.transaction(async (tx) => {
      const request = await tx.repo('changeRequests').findById(id);
      if (!request) throw AppError.notFound('Solicitud');
      if (request.status !== 'pending') {
        throw AppError.conflict('La solicitud ya fue resuelta.');
      }
      if (request.requesterId !== actor.id && !actor.permissions.includes('requests:resolve')) {
        throw AppError.forbidden('Solo quien creó la solicitud puede cancelarla.');
      }
      const updated = await tx.repo('changeRequests').update(
        id,
        {
          status: 'cancelled',
          resolutionNote: input.note ?? 'Solicitud cancelada por quien la creó.',
          resolvedBy: actor.id,
          resolvedByName: actor.name,
          resolvedAt: new Date().toISOString(),
          version: request.version + 1,
        },
        request.version,
      );
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'request.cancel',
          entity: 'changeRequest',
          entityId: id,
          metadata: { type: request.type, note: input.note ?? null },
        },
        tx,
      );
      return updated;
    });
  }
}
