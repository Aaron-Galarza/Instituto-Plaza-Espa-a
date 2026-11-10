import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CreateInsurerInput,
  type Insurer,
  type InsurerQuery,
  type PaginatedResult,
  type SessionUser,
  type UpdateInsurerInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { matchesSearch, normalizeForSearch, nullIfEmpty } from '../common/search';

@Injectable()
export class InsurersService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(query: InsurerQuery): Promise<PaginatedResult<Insurer>> {
    const insurers = await this.store.repo('insurers').all();
    const filtered = insurers.filter((insurer) => {
      if (query.status && insurer.status !== query.status) return false;
      return matchesSearch(`${insurer.name} ${insurer.code ?? ''}`, query.search);
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return paginate(filtered, query.page, query.pageSize);
  }

  async get(id: string): Promise<Insurer> {
    const insurer = await this.store.repo('insurers').findById(id);
    if (!insurer) throw AppError.notFound('Obra social');
    return insurer;
  }

  async create(actor: SessionUser, input: CreateInsurerInput): Promise<Insurer> {
    return this.store.transaction(async (tx) => {
      await this.assertNameAvailable(tx, input.name, null);
      const now = new Date().toISOString();
      const insurer: Insurer = {
        id: randomUUID(),
        name: input.name,
        code: nullIfEmpty(input.code),
        description: nullIfEmpty(input.description),
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('insurers').insert(insurer);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'insurer.create',
          entity: 'insurer',
          entityId: saved.id,
          metadata: { name: saved.name },
        },
        tx,
      );
      return saved;
    });
  }

  async update(actor: SessionUser, id: string, input: UpdateInsurerInput): Promise<Insurer> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('insurers').findById(id);
      if (!current) throw AppError.notFound('Obra social');
      if (input.name) await this.assertNameAvailable(tx, input.name, id);
      const patch: Partial<Insurer> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: nullIfEmpty(input.code) } : {}),
        ...(input.description !== undefined ? { description: nullIfEmpty(input.description) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('insurers').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'insurer.update',
          entity: 'insurer',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
        tx,
      );
      return updated;
    });
  }

  async setStatus(actor: SessionUser, id: string, status: 'active' | 'inactive'): Promise<Insurer> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const insurer = await tx.repo('insurers').findById(id);
      if (!insurer) throw AppError.notFound('Obra social');
      const patients = await tx.repo('patients').count((patient) => patient.insurerId === id);
      if (patients > 0) {
        throw AppError.reference(
          'La obra social tiene pacientes asociados. Desactivala en lugar de eliminarla.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'insurer.remove',
          entity: 'insurer',
          entityId: id,
          metadata: { name: insurer.name },
        },
        tx,
      );
      await tx.repo('insurers').remove(id);
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
      .repo('insurers')
      .findOne(
        (insurer) => insurer.id !== excludeId && normalizeForSearch(insurer.name) === normalized,
      );
    if (duplicate) throw AppError.conflict('Ya existe una obra social con ese nombre.');
  }
}
