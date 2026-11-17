import type { SessionUser } from '@plaza/shared';
import type { DataStore } from '../database/data-store';
import { normalizeForSearch } from './search';
import { assignedPatientIds } from '../patients/patient-validation';

export async function professionalCatalogScope(store: DataStore, user: SessionUser) {
  const insurerIds = new Set<string>();
  const serviceIds = new Set<string>();
  const spaceIds = new Set<string>();
  const professionalId = user.professionalId;
  if (user.role !== 'professional' || !professionalId) {
    return { insurerIds, serviceIds, spaceIds };
  }

  const [professional, patients, services, groups, rules, patientIds] = await Promise.all([
    store.repo('professionals').findById(professionalId),
    store.repo('patients').all(),
    store.repo('services').all(),
    store.repo('careGroups').all(),
    store.repo('scheduleRules').all(),
    assignedPatientIds(store, professionalId),
  ]);

  for (const patient of patients) {
    if (patientIds.has(patient.id) && patient.insurerId) insurerIds.add(patient.insurerId);
  }
  const names = new Set((professional?.specialties ?? []).map(normalizeForSearch));
  for (const service of services) {
    if (names.has(normalizeForSearch(service.name))) serviceIds.add(service.id);
  }

  const ownGroups = groups.filter((group) => group.professionalIds.includes(professionalId));
  const ownGroupIds = new Set(ownGroups.map((group) => group.id));
  for (const group of ownGroups) {
    serviceIds.add(group.serviceId);
    if (group.spaceId) spaceIds.add(group.spaceId);
  }
  for (const rule of rules) {
    for (const segment of rule.segments) {
      const related = segment.professionalIds.includes(professionalId) ||
        Boolean(segment.groupId && ownGroupIds.has(segment.groupId));
      if (!related) continue;
      serviceIds.add(segment.serviceId);
      if (segment.spaceId) spaceIds.add(segment.spaceId);
    }
  }
  return { insurerIds, serviceIds, spaceIds };
}
