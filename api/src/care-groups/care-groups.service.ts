import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CareGroup,
  type CareGroupQuery,
  type CreateCareGroupInput,
  type PaginatedResult,
  type SessionUser,
  type UpdateCareGroupInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { validateGroupReferences } from './care-group-validation';
import { matchesSearch, nullIfEmpty, uniq } from '../common/search';

@Injectable()
export class CareGroupsService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(user: SessionUser, query: CareGroupQuery): Promise<PaginatedResult<CareGroup>> {
    const groups = await this.store.repo('careGroups').all();
    const filtered = groups.filter((group) => {
      if (user.role === 'professional') {
        if (!user.professionalId) return false;
        if (!group.professionalIds.includes(user.professionalId)) return false;
      }
      if (query.status && group.status !== query.status) return false;
      if (query.serviceId && group.serviceId !== query.serviceId) return false;
      if (query.professionalId && !group.professionalIds.includes(query.professionalId))
        return false;
      if (query.spaceId && group.spaceId !== query.spaceId) return false;
      return matchesSearch(`${group.name} ${group.notes ?? ''}`, query.search);
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return paginate(filtered, query.page, query.pageSize);
  }

  async get(user: SessionUser, id: string): Promise<CareGroup> {
    const group = await this.store.repo('careGroups').findById(id);
    if (!group) throw AppError.notFound('Grupo');
    if (
      user.role === 'professional' &&
      (!user.professionalId || !group.professionalIds.includes(user.professionalId))
    ) {
      throw AppError.forbidden('No tenés acceso a este grupo.');
    }
    return group;
  }

  async create(actor: SessionUser, input: CreateCareGroupInput): Promise<CareGroup> {
    return this.store.transaction(async (tx) => {
      await validateGroupReferences(tx, {
        serviceId: input.serviceId,
        professionalIds: input.professionalIds,
        spaceId: input.spaceId ?? null,
        capacity: input.capacity,
        modality: input.modality,
      });
      const now = new Date().toISOString();
      const group: CareGroup = {
        id: randomUUID(),
        name: input.name,
        serviceId: input.serviceId,
        professionalIds: uniq(input.professionalIds),
        spaceId: input.spaceId ?? null,
        capacity: input.capacity,
        modality: input.modality,
        notes: nullIfEmpty(input.notes),
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('careGroups').insert(group);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'group.create',
          entity: 'careGroup',
          entityId: saved.id,
          metadata: { name: saved.name, capacity: saved.capacity, modality: saved.modality },
        },
        tx,
      );
      return saved;
    });
  }

  async update(actor: SessionUser, id: string, input: UpdateCareGroupInput): Promise<CareGroup> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('careGroups').findById(id);
      if (!current) throw AppError.notFound('Grupo');

      const professionalIds = input.professionalIds ?? current.professionalIds;
      const serviceId = input.serviceId ?? current.serviceId;
      const spaceId = input.spaceId !== undefined ? input.spaceId : (current.spaceId ?? null);
      const capacity = input.capacity ?? current.capacity;
      const modality = input.modality ?? current.modality;

      await validateGroupReferences(tx, {
        serviceId,
        professionalIds,
        spaceId,
        capacity,
        modality,
      });

      const patch: Partial<CareGroup> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.serviceId !== undefined ? { serviceId } : {}),
        ...(input.professionalIds !== undefined ? { professionalIds: uniq(professionalIds) } : {}),
        ...(input.spaceId !== undefined ? { spaceId } : {}),
        ...(input.capacity !== undefined ? { capacity } : {}),
        ...(input.modality !== undefined ? { modality } : {}),
        ...(input.notes !== undefined ? { notes: nullIfEmpty(input.notes) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('careGroups').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'group.update',
          entity: 'careGroup',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
        tx,
      );
      return updated;
    });
  }

  async setStatus(
    actor: SessionUser,
    id: string,
    status: 'active' | 'inactive',
  ): Promise<CareGroup> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const group = await tx.repo('careGroups').findById(id);
      if (!group) throw AppError.notFound('Grupo');
      const rules = await tx
        .repo('scheduleRules')
        .count((rule) => rule.segments.some((segment) => segment.groupId === id));
      if (rules > 0) {
        throw AppError.reference(
          'El grupo tiene jornadas asociadas. Desactivalo en lugar de eliminarlo.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'group.remove',
          entity: 'careGroup',
          entityId: id,
          metadata: { name: group.name },
        },
        tx,
      );
      await tx.repo('careGroups').remove(id);
      return { removed: true };
    });
  }
}
