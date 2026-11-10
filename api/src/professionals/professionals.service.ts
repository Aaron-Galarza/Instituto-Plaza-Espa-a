import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CreateProfessionalInput,
  type PaginatedResult,
  type Professional,
  type ProfessionalQuery,
  type SessionUser,
  type UpdateProfessionalInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { sanitizeProfessional, assertUserLinkAvailable } from './professional-validation';
import { matchesSearch, nullIfEmpty, personName, uniq } from '../common/search';

@Injectable()
export class ProfessionalsService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(user: SessionUser, query: ProfessionalQuery): Promise<PaginatedResult<Professional>> {
    const professionals = await this.store.repo('professionals').all();
    const filtered = professionals.filter((professional) => {
      if (query.status && professional.status !== query.status) return false;
      if (query.userId && professional.userId !== query.userId) return false;
      return matchesSearch(
        `${professional.firstName} ${professional.lastName} ${professional.specialties.join(' ')}`,
        query.search,
      );
    });
    filtered.sort((a, b) => personName(a).localeCompare(personName(b), 'es'));
    const page = paginate(filtered, query.page, query.pageSize);
    return { ...page, items: page.items.map((item) => sanitizeProfessional(item, user)) };
  }

  async get(user: SessionUser, id: string): Promise<Professional> {
    const professional = await this.store.repo('professionals').findById(id);
    if (!professional) throw AppError.notFound('Profesional');
    return sanitizeProfessional(professional, user);
  }

  async create(actor: SessionUser, input: CreateProfessionalInput): Promise<Professional> {
    return this.store.transaction(async (tx) => {
      if (input.userId) await assertUserLinkAvailable(tx, input.userId, null);
      const now = new Date().toISOString();
      const professional: Professional = {
        id: randomUUID(),
        firstName: input.firstName,
        lastName: input.lastName,
        specialties: uniq(input.specialties),
        color: input.color,
        phone: nullIfEmpty(input.phone),
        email: nullIfEmpty(input.email),
        userId: input.userId ?? null,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('professionals').insert(professional);
      if (saved.userId) {
        await tx.repo('users').update(saved.userId, { professionalId: saved.id });
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'professional.create',
          entity: 'professional',
          entityId: saved.id,
          metadata: { name: personName(saved) },
        },
        tx,
      );
      return saved;
    });
  }

  async update(
    actor: SessionUser,
    id: string,
    input: UpdateProfessionalInput,
  ): Promise<Professional> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('professionals').findById(id);
      if (!current) throw AppError.notFound('Profesional');

      let userIdChanged = false;
      const nextUserId = input.userId !== undefined ? input.userId : (current.userId ?? null);
      if (input.userId !== undefined && input.userId !== current.userId) {
        if (nextUserId) await assertUserLinkAvailable(tx, nextUserId, id);
        if (current.userId) {
          const oldUser = await tx.repo('users').findById(current.userId);
          if (oldUser && oldUser.professionalId === id) {
            await tx.repo('users').update(oldUser.id, { professionalId: null });
          }
        }
        if (nextUserId) {
          await tx.repo('users').update(nextUserId, { professionalId: id });
        }
        userIdChanged = true;
      }

      const patch: Partial<Professional> = {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.specialties !== undefined ? { specialties: uniq(input.specialties) } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.phone !== undefined ? { phone: nullIfEmpty(input.phone) } : {}),
        ...(input.email !== undefined ? { email: nullIfEmpty(input.email) } : {}),
        ...(userIdChanged ? { userId: nextUserId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('professionals').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'professional.update',
          entity: 'professional',
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
  ): Promise<Professional> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const professional = await tx.repo('professionals').findById(id);
      if (!professional) throw AppError.notFound('Profesional');

      const availability = await tx
        .repo('professionalAvailability')
        .count((entry) => entry.professionalId === id);
      const groups = await tx
        .repo('careGroups')
        .count((group) => group.professionalIds.includes(id));
      const rules = await tx
        .repo('scheduleRules')
        .count((rule) => rule.segments.some((segment) => segment.professionalIds.includes(id)));

      if (availability > 0 || groups > 0 || rules > 0) {
        throw AppError.reference(
          'El profesional tiene disponibilidad, grupos o jornadas asociadas. Desactivalo para conservar el historial.',
        );
      }

      if (professional.userId) {
        const linked = await tx.repo('users').findById(professional.userId);
        if (linked && linked.professionalId === id) {
          await tx.repo('users').update(linked.id, { professionalId: null });
        }
      }

      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'professional.remove',
          entity: 'professional',
          entityId: id,
          metadata: { name: personName(professional) },
        },
        tx,
      );
      await tx.repo('professionals').remove(id);
      return { removed: true };
    });
  }
}
