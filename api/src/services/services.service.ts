import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CreateServiceInput,
  type PaginatedResult,
  type Service,
  type ServiceQuery,
  type SessionUser,
  type UpdateServiceInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { matchesSearch, normalizeForSearch, nullIfEmpty, uniq } from '../common/search';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(query: ServiceQuery): Promise<PaginatedResult<Service>> {
    const services = await this.store.repo('services').all();
    const filtered = services.filter((service) => {
      if (query.status && service.status !== query.status) return false;
      if (query.modality && !service.allowedModalities.includes(query.modality)) return false;
      return matchesSearch(`${service.name} ${service.description ?? ''}`, query.search);
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return paginate(filtered, query.page, query.pageSize);
  }

  async get(id: string): Promise<Service> {
    const service = await this.store.repo('services').findById(id);
    if (!service) throw AppError.notFound('Prestación');
    return service;
  }

  async create(actor: SessionUser, input: CreateServiceInput): Promise<Service> {
    return this.store.transaction(async (tx) => {
      await this.assertNameAvailable(tx, input.name, null);
      const now = new Date().toISOString();
      const service: Service = {
        id: randomUUID(),
        name: input.name,
        description: nullIfEmpty(input.description),
        allowedModalities: uniq(input.allowedModalities),
        suggestedDurationMinutes: input.suggestedDurationMinutes ?? null,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('services').insert(service);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'service.create',
          entity: 'service',
          entityId: saved.id,
          metadata: { name: saved.name },
        },
        tx,
      );
      return saved;
    });
  }

  async update(actor: SessionUser, id: string, input: UpdateServiceInput): Promise<Service> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('services').findById(id);
      if (!current) throw AppError.notFound('Prestación');
      if (input.name) await this.assertNameAvailable(tx, input.name, id);
      const patch: Partial<Service> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: nullIfEmpty(input.description) } : {}),
        ...(input.allowedModalities !== undefined
          ? { allowedModalities: uniq(input.allowedModalities) }
          : {}),
        ...(input.suggestedDurationMinutes !== undefined
          ? { suggestedDurationMinutes: input.suggestedDurationMinutes ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('services').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'service.update',
          entity: 'service',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
        tx,
      );
      return updated;
    });
  }

  async setStatus(actor: SessionUser, id: string, status: 'active' | 'inactive'): Promise<Service> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const service = await tx.repo('services').findById(id);
      if (!service) throw AppError.notFound('Prestación');
      const groups = await tx.repo('careGroups').count((group) => group.serviceId === id);
      const rules = await tx
        .repo('scheduleRules')
        .count((rule) => rule.segments.some((segment) => segment.serviceId === id));
      if (groups > 0 || rules > 0) {
        throw AppError.reference(
          'La prestación tiene grupos o jornadas asociadas. Desactivala en lugar de eliminarla.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'service.remove',
          entity: 'service',
          entityId: id,
          metadata: { name: service.name },
        },
        tx,
      );
      await tx.repo('services').remove(id);
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
      .repo('services')
      .findOne(
        (service) => service.id !== excludeId && normalizeForSearch(service.name) === normalized,
      );
    if (duplicate) throw AppError.conflict('Ya existe una prestación con ese nombre.');
  }
}
