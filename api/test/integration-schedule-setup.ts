import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function setupSchedule(ctx: ScenarioContext) {
  const { request, adminCookie, directorCookie, patientId } = ctx;
    const professionalResponse = await request(
      'POST',
      '/professionals',
      {
        firstName: 'Ana',
        lastName: 'Profesional',
        specialties: ['Kinesiología'],
        color: '#1F5297',
      },
      adminCookie,
    );
    expect(professionalResponse.statusCode).toBe(201);
    const professionalId = professionalResponse.json().id as string;
    const serviceResponse = await request(
      'POST',
      '/services',
      {
        name: 'Kinesiología',
        allowedModalities: ['individual'],
      },
      adminCookie,
    );
    expect(serviceResponse.statusCode).toBe(201);
    const serviceId = serviceResponse.json().id as string;
    const availability = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'regular',
        dayOfWeek: 1,
        startMinute: 480,
        endMinute: 780,
        effectiveFrom: '2026-10-01',
        status: 'active',
      },
      adminCookie,
    );
    expect(availability.statusCode).toBe(201);
    const user = await request(
      'POST',
      '/users',
      {
        name: 'Ana Profesional',
        email: 'profesional@test.local',
        password: 'ClaveSegura123',
        role: 'professional',
        professionalId,
      },
      adminCookie,
    );
    expect(user.statusCode).toBe(201);

    const ruleResponse = await request(
      'POST',
      '/schedule/rules',
      {
        patientId,
        daysOfWeek: [1],
        effectiveFrom: '2026-10-26',
        effectiveTo: '2026-11-02',
        startMinute: 540,
        endMinute: 600,
        segments: [
          {
            serviceId,
            professionalIds: [professionalId],
            startMinute: 540,
            endMinute: 600,
            modality: 'individual',
          },
        ],
      },
      adminCookie,
    );
    expect(ruleResponse.statusCode).toBe(201);
    const ruleId = ruleResponse.json().rule.id as string;
    const staleDateEdit = await request(
      'POST',
      `/schedule/rules/${ruleId}/change`,
      {
        scope: 'date',
        date: '2026-10-26',
        expectedVersion: 99,
        changes: { notes: 'Cambio obsoleto' },
      },
      adminCookie,
    );
    expect(staleDateEdit.statusCode).toBe(409);
    const agenda = await request(
      'GET',
      '/schedule?from=2026-10-26&to=2026-11-02',
      undefined,
      adminCookie,
    );
    expect(agenda.statusCode).toBe(200);
    expect(agenda.json().occurrences).toHaveLength(2);
    const dashboard = await request(
      'GET',
      '/dashboard?from=2026-10-26&to=2026-10-26',
      undefined,
      directorCookie,
    );
    expect(dashboard.json().metrics).toMatchObject({ uniquePatients: 1, journeys: 1, services: 1 });

    ctx.professionalId = professionalId;
    ctx.serviceId = serviceId;
    ctx.ruleId = ruleId;
}
