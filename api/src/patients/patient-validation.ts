import { todayInInstitutionTz } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';

/** IDs de pacientes con jornadas vigentes o futuras del profesional. */
export async function assignedPatientIds(
  store: DataStore,
  professionalId: string | null,
): Promise<Set<string>> {
  if (!professionalId) return new Set();
  const today = todayInInstitutionTz();
  const rules = await store
    .repo('scheduleRules')
    .where((rule) => rule.status === 'active' && (!rule.effectiveTo || rule.effectiveTo >= today));
  const groups = await store.repo('careGroups').all();
  const groupsByProfessional = new Set(
    groups
      .filter((group) => group.professionalIds.includes(professionalId))
      .map((group) => group.id),
  );
  const ids = new Set<string>();
  for (const rule of rules) {
    const participates = rule.segments.some(
      (segment) =>
        segment.professionalIds.includes(professionalId) ||
        (segment.groupId ? groupsByProfessional.has(segment.groupId) : false),
    );
    if (participates) ids.add(rule.patientId);
  }
  return ids;
}

export async function assertInsurerExists(
  store: DataStore,
  insurerId: string | null,
): Promise<void> {
  if (!insurerId) return;
  const insurer = await store.repo('insurers').findById(insurerId);
  if (!insurer) throw AppError.validation('La obra social indicada no existe.');
}

export function assertBirthDate(value: string | undefined): void {
  if (!value) return;
  if (value > todayInInstitutionTz()) {
    throw AppError.validation('La fecha de nacimiento no puede ser futura.');
  }
}
