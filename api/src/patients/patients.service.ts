import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  paginate,
  type CreatePatientInput,
  type PaginatedResult,
  type Patient,
  type PatientQuery,
  type SessionUser,
  type UpdatePatientInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { assignedPatientIds, assertInsurerExists, assertBirthDate } from './patient-validation';
import { matchesSearch, nullIfEmpty, personName } from '../common/search';

@Injectable()
export class PatientsService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  async list(user: SessionUser, query: PatientQuery): Promise<PaginatedResult<Patient>> {
    let patients = await this.store.repo('patients').all();

    if (user.role === 'professional') {
      const assigned = await assignedPatientIds(this.store, user.professionalId);
      patients = patients.filter((patient) => assigned.has(patient.id));
    }

    const filtered = patients.filter((patient) => {
      if (query.status && patient.status !== query.status) return false;
      if (query.insurerId && patient.insurerId !== query.insurerId) return false;
      return matchesSearch(
        `${patient.firstName} ${patient.lastName} ${patient.document ?? ''} ${patient.phone ?? ''}`,
        query.search,
      );
    });
    filtered.sort((a, b) => personName(a).localeCompare(personName(b), 'es'));
    return paginate(filtered, query.page, query.pageSize);
  }

  async get(user: SessionUser, id: string): Promise<Patient> {
    const patient = await this.store.repo('patients').findById(id);
    if (!patient) throw AppError.notFound('Paciente');
    if (user.role === 'professional') {
      const assigned = await assignedPatientIds(this.store, user.professionalId);
      if (!assigned.has(id)) throw AppError.forbidden('No tenés acceso a este paciente.');
    }
    return patient;
  }

  async create(actor: SessionUser, input: CreatePatientInput): Promise<Patient> {
    return this.store.transaction(async (tx) => {
      await assertInsurerExists(tx, input.insurerId ?? null);
      const document = nullIfEmpty(input.document);
      if (document) {
        const duplicate = await tx
          .repo('patients')
          .findOne((patient) => patient.document === document);
        if (duplicate) throw AppError.conflict('Ya existe un paciente con ese documento.');
      }
      assertBirthDate(input.birthDate);

      const now = new Date().toISOString();
      const patient: Patient = {
        id: randomUUID(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        document,
        birthDate: input.birthDate ?? null,
        phone: nullIfEmpty(input.phone),
        email: nullIfEmpty(input.email),
        insurerId: input.insurerId ?? null,
        affiliateNumber: nullIfEmpty(input.affiliateNumber),
        transportMode: input.transportMode ?? 'none',
        adminNotes: nullIfEmpty(input.adminNotes),
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('patients').insert(patient);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'patient.create',
          entity: 'patient',
          entityId: saved.id,
          metadata: { name: personName(saved) },
        },
        tx,
      );
      return saved;
    });
  }

  async update(actor: SessionUser, id: string, input: UpdatePatientInput): Promise<Patient> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('patients').findById(id);
      if (!current) throw AppError.notFound('Paciente');

      if (input.insurerId !== undefined) {
        await assertInsurerExists(tx, input.insurerId ?? null);
      }
      const document =
        input.document !== undefined ? nullIfEmpty(input.document) : (current.document ?? null);
      if (document) {
        const duplicate = await tx
          .repo('patients')
          .findOne((patient) => patient.id !== id && patient.document === document);
        if (duplicate) throw AppError.conflict('Ya existe un paciente con ese documento.');
      }
      if (input.birthDate !== undefined) assertBirthDate(input.birthDate);

      const patch: Partial<Patient> = {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.document !== undefined ? { document } : {}),
        ...(input.birthDate !== undefined ? { birthDate: input.birthDate ?? null } : {}),
        ...(input.phone !== undefined ? { phone: nullIfEmpty(input.phone) } : {}),
        ...(input.email !== undefined ? { email: nullIfEmpty(input.email) } : {}),
        ...(input.insurerId !== undefined ? { insurerId: input.insurerId ?? null } : {}),
        ...(input.affiliateNumber !== undefined
          ? { affiliateNumber: nullIfEmpty(input.affiliateNumber) }
          : {}),
        ...(input.transportMode !== undefined ? { transportMode: input.transportMode } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: nullIfEmpty(input.adminNotes) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const updated = await tx.repo('patients').update(id, patch);
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'patient.update',
          entity: 'patient',
          entityId: id,
          metadata: { fields: Object.keys(input) },
        },
        tx,
      );
      return updated;
    });
  }

  async setStatus(actor: SessionUser, id: string, status: 'active' | 'inactive'): Promise<Patient> {
    return this.update(actor, id, { status });
  }

  async remove(actor: SessionUser, id: string): Promise<{ removed: true }> {
    return this.store.transaction(async (tx) => {
      const patient = await tx.repo('patients').findById(id);
      if (!patient) throw AppError.notFound('Paciente');
      const rules = await tx.repo('scheduleRules').where((rule) => rule.patientId === id);
      if (rules.length > 0) {
        throw AppError.reference(
          'El paciente tiene jornadas asociadas. Desactivalo en lugar de eliminarlo para conservar el historial.',
        );
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'patient.remove',
          entity: 'patient',
          entityId: id,
          metadata: { name: personName(patient) },
        },
        tx,
      );
      await tx.repo('patients').remove(id);
      return { removed: true };
    });
  }
}
