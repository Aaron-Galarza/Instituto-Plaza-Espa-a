import { randomUUID } from 'node:crypto';
import {
  daysBetween,
  type AssignmentIssueDetail,
  type CreateAvailabilityInput,
  type ProfessionalAvailability,
  type SessionUser,
  type UpdateAvailabilityInput,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { generateIssues } from './availability-issues';
import { decorateIssues } from './availability-issue-details';
import { validateEntry } from './availability-validation';

type EntryStatus = 'active' | 'inactive';
const MAX_ABSENCE_DAYS = 366;

export class AvailabilityEntryActions {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}
  async create(
    actor: SessionUser,
    input: CreateAvailabilityInput,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.store.transaction(async (tx) => {
      const professional = await tx.repo('professionals').findById(input.professionalId);
      if (!professional) throw AppError.validation('El profesional indicado no existe.');
      if (professional.status !== 'active') {
        throw AppError.validation('El profesional está inactivo.');
      }
      if (input.kind === 'absence' && !input.effectiveTo) {
        throw AppError.validation('La ausencia requiere una fecha de finalización.');
      }
      if (input.kind !== 'regular' && input.effectiveTo) {
        if (daysBetween(input.effectiveFrom, input.effectiveTo) > MAX_ABSENCE_DAYS) {
          throw AppError.validation('El período no puede superar 366 días.');
        }
      }

      const now = new Date().toISOString();
      const entry: ProfessionalAvailability = {
        id: randomUUID(),
        professionalId: input.professionalId,
        kind: input.kind,
        dayOfWeek: input.dayOfWeek ?? null,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
        status: input.status ?? 'active',
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await validateEntry(tx, entry, null);

      const saved = await tx.repo('professionalAvailability').insert(entry);
      const issues =
        saved.kind === 'absence' && saved.status === 'active'
          ? await generateIssues(tx, saved)
          : [];

      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'availability.create',
          entity: 'professionalAvailability',
          entityId: saved.id,
          metadata: {
            professionalId: saved.professionalId,
            kind: saved.kind,
            from: saved.effectiveFrom,
            to: saved.effectiveTo,
            affectedAssignments: issues.length,
          },
        },
        tx,
      );
      return { entry: saved, issues: await decorateIssues(tx, issues) };
    });
  }

  async update(
    actor: SessionUser,
    id: string,
    input: UpdateAvailabilityInput,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('professionalAvailability').findById(id);
      if (!current) throw AppError.notFound('Disponibilidad');

      const next: ProfessionalAvailability = {
        ...current,
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(input.dayOfWeek !== undefined ? { dayOfWeek: input.dayOfWeek } : {}),
        ...(input.startMinute !== undefined ? { startMinute: input.startMinute } : {}),
        ...(input.endMinute !== undefined ? { endMinute: input.endMinute } : {}),
        ...(input.effectiveFrom !== undefined ? { effectiveFrom: input.effectiveFrom } : {}),
        ...(input.effectiveTo !== undefined ? { effectiveTo: input.effectiveTo ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
      };
      if (next.kind === 'absence' && !next.effectiveTo) {
        throw AppError.validation('La ausencia requiere una fecha de finalización.');
      }
      if (next.kind !== 'regular' && next.effectiveTo) {
        if (daysBetween(next.effectiveFrom, next.effectiveTo) > MAX_ABSENCE_DAYS) {
          throw AppError.validation('El período no puede superar 366 días.');
        }
      }
      await validateEntry(tx, next, id);
      const saved = await tx.repo('professionalAvailability').update(id, next);

      // Recalcular sólo afectaciones pendientes; las resueltas son historial.
      const pending = await tx
        .repo('assignmentIssues')
        .where((issue) => issue.absenceId === id && issue.status === 'pending');
      for (const issue of pending) await tx.repo('assignmentIssues').remove(issue.id);

      const issues =
        saved.kind === 'absence' && saved.status === 'active'
          ? await generateIssues(tx, saved)
          : [];

      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'availability.update',
          entity: 'professionalAvailability',
          entityId: id,
          metadata: {
            fields: Object.keys(input),
            affectedAssignments: issues.length,
          },
        },
        tx,
      );
      return { entry: saved, issues: await decorateIssues(tx, issues) };
    });
  }

  async setStatus(
    actor: SessionUser,
    id: string,
    status: EntryStatus,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const entry = await tx.repo('professionalAvailability').findById(id);
      if (!entry) throw AppError.notFound('Disponibilidad');
      const pending = await tx
        .repo('assignmentIssues')
        .where((issue) => issue.absenceId === id && issue.status === 'pending');
      for (const issue of pending) await tx.repo('assignmentIssues').remove(issue.id);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'availability.remove',
          entity: 'professionalAvailability',
          entityId: id,
          metadata: { kind: entry.kind, professionalId: entry.professionalId },
        },
        tx,
      );
      await tx.repo('professionalAvailability').remove(id);
      return { removed: true };
    });
  }
}
