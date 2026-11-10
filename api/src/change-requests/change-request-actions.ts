import { randomUUID } from 'node:crypto';
import {
  type AdjustChangeRequestInput,
  type ChangeRequest,
  type CreateChangeRequestInput,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { assertRuleAccess, buildProposal, findOccurrence } from './change-request-helpers';

export class ChangeRequestActions {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}
  async create(actor: SessionUser, input: CreateChangeRequestInput): Promise<ChangeRequest> {
    return this.store.transaction(async (tx) => {
      const rule = await tx.repo('scheduleRules').findById(input.scheduleRuleId);
      if (!rule) throw AppError.notFound('Jornada');
      if (rule.status !== 'active') {
        throw AppError.conflict('La recurrencia no está activa.');
      }
      const ctx = await loadSchedulingContext(tx);
      assertRuleAccess(actor, rule, ctx);
      const occurrence = findOccurrence(ctx, rule.id, input.date);
      if (!occurrence) {
        throw AppError.validation(
          'La fecha indicada no tiene una jornada programada para esa recurrencia.',
        );
      }
      if (occurrence.status === 'cancelled') {
        throw AppError.conflict('La fecha ya está cancelada.');
      }

      const proposal = buildProposal(input, occurrence);
      const now = new Date().toISOString();
      const request: ChangeRequest = {
        id: randomUUID(),
        requesterId: actor.id,
        requesterName: actor.name,
        resourceType: 'scheduleRule',
        resourceId: rule.id,
        type: input.type,
        proposal,
        reason: input.reason,
        status: 'pending',
        resolutionNote: null,
        resolvedBy: null,
        resolvedByName: null,
        resolvedAt: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('changeRequests').insert(request);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'request.create',
          entity: 'changeRequest',
          entityId: saved.id,
          metadata: {
            type: saved.type,
            scheduleRuleId: rule.id,
            date: input.date,
            requesterId: actor.id,
          },
        },
        tx,
      );
      return saved;
    });
  }

  async adjust(
    actor: SessionUser,
    id: string,
    input: AdjustChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.store.transaction(async (tx) => {
      const request = await tx.repo('changeRequests').findById(id);
      if (!request) throw AppError.notFound('Solicitud');
      if (request.status !== 'pending')
        throw AppError.conflict('Solo se puede ajustar una solicitud pendiente.');
      if (request.version !== input.expectedVersion) throw AppError.staleWrite();
      if (input.scheduleRuleId !== request.resourceId || input.type !== request.type) {
        throw AppError.validation('El tipo y la recurrencia de la solicitud no se pueden cambiar.');
      }
      const rule = await tx.repo('scheduleRules').findById(request.resourceId);
      if (!rule) throw AppError.notFound('Jornada');
      const ctx = await loadSchedulingContext(tx);
      const occurrence = findOccurrence(ctx, rule.id, input.date);
      if (!occurrence || occurrence.status === 'cancelled') {
        throw AppError.conflict('La nueva fecha no tiene una jornada activa.');
      }
      const proposal = buildProposal(input, occurrence);
      const updated = await tx.repo('changeRequests').update(
        id,
        {
          proposal,
          reason: input.reason,
          version: request.version + 1,
        },
        request.version,
      );
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'request.adjust',
          entity: 'changeRequest',
          entityId: id,
          metadata: { type: request.type, date: proposal.date, version: updated.version },
        },
        tx,
      );
      return updated;
    });
  }
}
