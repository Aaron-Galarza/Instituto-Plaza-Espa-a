import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function checkFirstGroupMember(ctx: ScenarioContext): Promise<void> {
  const { request, adminCookie, professionalId, serviceId } = ctx;
  const service = await request('POST', '/services', {
    name: 'Taller primer integrante', allowedModalities: ['group'],
  }, adminCookie);
  expect(service.statusCode).toBe(201);
  const group = await request('POST', '/care-groups', {
    name: 'Grupo sin agenda previa',
    serviceId: service.json().id,
    professionalIds: [professionalId],
    capacity: 2,
    modality: 'group',
  }, adminCookie);
  expect(group.statusCode).toBe(201);
  const patient = await request('POST', '/patients', {
    firstName: 'Primer', lastName: 'Integrante', transportMode: 'none',
  }, adminCookie);
  expect(patient.statusCode).toBe(201);
  const original = await request('POST', '/schedule/rules', {
    patientId: patient.json().id,
    daysOfWeek: [1],
    effectiveFrom: '2026-11-23',
    effectiveTo: '2026-11-23',
    startMinute: 660,
    endMinute: 720,
    segments: [{
      serviceId, professionalIds: [professionalId],
      startMinute: 660, endMinute: 720, modality: 'individual',
    }],
  }, adminCookie);
  expect(original.statusCode, JSON.stringify(original.json())).toBe(201);
  const rule = original.json().rule as {
    id: string; version: number; segments: Array<{ id: string }>;
  };

  const changed = await request('POST', `/schedule/rules/${rule.id}/change`, {
    scope: 'future',
    date: '2026-11-23',
    expectedVersion: rule.version,
    changes: {
      startMinute: 660,
      endMinute: 765,
      segments: [
        { id: rule.segments[0]!.id, serviceId, professionalIds: [professionalId],
          startMinute: 660, endMinute: 720, modality: 'individual' },
        { serviceId: service.json().id, professionalIds: [professionalId],
          groupId: group.json().id, startMinute: 720, endMinute: 765, modality: 'group' },
      ],
    },
  }, adminCookie);
  expect(changed.statusCode, JSON.stringify(changed.json())).toBe(201);
  expect(changed.json().rule.segments).toHaveLength(2);
}
