import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CreateSpaceInput,
  type PaginatedResult,
  type SessionUser,
  type Space,
  type SpaceQuery,
  type UpdateSpaceInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { matchesSearch, normalizeForSearch, nullIfEmpty } from '../common/search';

@Injectable()
export class SpacesService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(query: SpaceQuery): Promise<PaginatedResult<Space>> {
    const spaces = await this.store.repo('spaces').all();
    const filtered = spaces.filter((space) => {
      if (query.status && space.status !== query.status) return false;
      return matchesSearch(`${space.name} ${space.description ?? ''}`, query.search);
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return paginate(filtered, query.page, query.pageSize);
  }

  async get(id: string): Promise<Space> {
    const space = await this.store.repo('spaces').findById(id);
    if (!space) throw AppError.notFound('Espacio');
    return space;
  }

  async create(actor: SessionUser, input: CreateSpaceInput): Promise<Space> {
    return this.store.transaction(async (tx) => {
      await this.assertNameAvailable(tx, input.name, null);
      const now = new Date().toISOString();
      const space: Space = {
        id: randomUUID(),
        name: input.name,
        description: nullIfEmpty(input.description),
        capacity: input.capacity,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('spaces').insert(space);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'space.create',
          entity: 'space',
          entityId: saved.id,
          metadata: { name: saved.name, capacity: saved.capacity },
        },
        tx,
      );
      return saved;
    });
  }

  async update(actor: SessionUser, id: string, input: UpdateSpaceInput): Promise<Space> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('spaces').findById(id);
      if (!current) throw AppError.notFound('Espacio');
      if (input.name) await this.assertNameAvailable(tx, input.name, id);
      if (input.capacity !== undefined && input.capacity < current.capacity) {
        const oversizedGroup = await tx
          .repo('careGroups')
          .findOne((group) => group.spaceId === id && group.capacity > input.capacity!);
        if (oversizedGroup) {
          throw AppError.conflict(
            `La capacidad no puede ser menor a la del grupo "${oversizedGroup.name}" (${oversizedGroup.capacity}).`,
          );
        }
      }
      const patch: Partial<Space> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: nullIfEmpty(input.description) } : {}),
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('spaces').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'space.update',
          entity: 'space',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
        tx,
      );
      return updated;
    });
  }

  async setStatus(actor: SessionUser, id: string, status: 'active' | 'inactive'): Promise<Space> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const space = await tx.repo('spaces').findById(id);
      if (!space) throw AppError.notFound('Espacio');
      const groups = await tx.repo('careGroups').count((group) => group.spaceId === id);
      const rules = await tx
        .repo('scheduleRules')
        .count((rule) => rule.segments.some((segment) => segment.spaceId === id));
      if (groups > 0 || rules > 0) {
        throw AppError.reference(
          'El espacio tiene grupos o jornadas asociadas. Desactivalo en lugar de eliminarlo.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'space.remove',
          entity: 'space',
          entityId: id,
          metadata: { name: space.name },
        },
        tx,
      );
      await tx.repo('spaces').remove(id);
      return { removed: true };
    });
  }

  private async assertNameAvailable(
    store: DataStore,
    name: string,
    excludeId: string | null,
  ): Promise<void> {
    const normalized = normalizeForSearch(name.trim());
    const duplicate = await store
      .repo('spaces')
      .findOne((space) => space.id !== excludeId && normalizeForSearch(space.name) === normalized);
    if (duplicate) throw AppError.conflict('Ya existe un espacio con ese nombre.');
  }
}
