import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function checkProfessionalVisibility(ctx: ScenarioContext): Promise<void> {
  const { request, adminCookie, professionalCookie, professionalId, patientId, serviceId } = ctx;
  const create = async (path: string, payload: object) => {
    const response = await request('POST', path, payload, adminCookie);
    expect(response.statusCode, JSON.stringify(response.json())).toBe(201);
    return response.json().id as string;
  };
  const visibleIds = async (path: string) => {
    const response = await request('GET', `${path}?page=1&pageSize=100`, undefined, professionalCookie);
    expect(response.statusCode).toBe(200);
    return (response.json().items as Array<{ id: string }>).map((item) => item.id);
  };

  const otherServiceId = await create('/services', {
    name: 'Prestación ajena', allowedModalities: ['individual', 'group'],
  });
  expect(await visibleIds('/services')).toContain(serviceId);
  expect(await visibleIds('/services')).not.toContain(otherServiceId);
  expect((await request('GET', `/services/${otherServiceId}`, undefined, professionalCookie)).statusCode).toBe(403);

  const relatedInsurerId = await create('/insurers', { name: 'Cobertura del paciente asignado' });
  const otherInsurerId = await create('/insurers', { name: 'Cobertura ajena' });
  const linked = await request('PATCH', `/patients/${patientId}`, {
    insurerId: relatedInsurerId,
  }, adminCookie);
  expect(linked.statusCode).toBe(200);
  expect(await visibleIds('/insurers')).toContain(relatedInsurerId);
  expect(await visibleIds('/insurers')).not.toContain(otherInsurerId);
  expect((await request('GET', `/insurers/${otherInsurerId}`, undefined, professionalCookie)).statusCode).toBe(403);

  const relatedSpaceId = await create('/spaces', { name: 'Sala asignada', capacity: 4 });
  const otherSpaceId = await create('/spaces', { name: 'Sala ajena', capacity: 4 });
  const groupServiceId = await create('/services', {
    name: 'Taller asignado', allowedModalities: ['group'],
  });
  const ownGroupId = await create('/care-groups', {
    name: 'Grupo asignado', serviceId: groupServiceId,
    professionalIds: [professionalId], spaceId: relatedSpaceId,
    capacity: 3, modality: 'group',
  });
  const otherProfessionalId = await create('/professionals', {
    firstName: 'Profesional', lastName: 'Ajeno', color: '#1F5297',
    specialties: ['Prestación ajena'],
  });
  const otherGroupId = await create('/care-groups', {
    name: 'Grupo ajeno', serviceId: otherServiceId,
    professionalIds: [otherProfessionalId], spaceId: otherSpaceId,
    capacity: 3, modality: 'group',
  });
  expect(await visibleIds('/spaces')).toContain(relatedSpaceId);
  expect(await visibleIds('/spaces')).not.toContain(otherSpaceId);
  expect((await request('GET', `/spaces/${otherSpaceId}`, undefined, professionalCookie)).statusCode).toBe(403);
  expect(await visibleIds('/care-groups')).toContain(ownGroupId);
  expect(await visibleIds('/care-groups')).not.toContain(otherGroupId);
  expect((await request('GET', `/care-groups/${otherGroupId}`, undefined, professionalCookie)).statusCode).toBe(403);
  expect(await visibleIds('/services')).toContain(groupServiceId);

  const otherPatientId = await create('/patients', {
    firstName: 'Paciente', lastName: 'Ajeno', transportMode: 'none',
  });
  expect(await visibleIds('/patients')).toContain(patientId);
  expect(await visibleIds('/patients')).not.toContain(otherPatientId);
  expect((await request('GET', `/patients/${otherPatientId}`, undefined, professionalCookie)).statusCode).toBe(403);
  expect(await visibleIds('/professionals')).toEqual([professionalId]);
  expect((await request('GET', `/professionals/${otherProfessionalId}`, undefined, professionalCookie)).statusCode).toBe(403);

  const availability = await request('GET', '/availability', undefined, professionalCookie);
  expect(availability.statusCode).toBe(200);
  expect(availability.json().every((item: { professionalId: string }) =>
    item.professionalId === professionalId)).toBe(true);
  const agenda = await request('GET', '/schedule?from=2026-10-26&to=2026-11-16', undefined, professionalCookie);
  expect(agenda.statusCode).toBe(200);
  const occurrence = agenda.json().occurrences[0] as { ruleId: string; date: string };
  const options = await request('GET', `/change-requests/options?ruleId=${occurrence.ruleId}&date=${occurrence.date}`, undefined, professionalCookie);
  expect(options.statusCode, JSON.stringify(options.json())).toBe(200);
  expect(options.json().professionals.map((item: { id: string }) => item.id)).toContain(professionalId);
  expect(options.json().professionals.map((item: { id: string }) => item.id)).not.toContain(otherProfessionalId);
  expect(options.json().spaces.map((item: { id: string }) => item.id)).toContain(otherSpaceId);
}
