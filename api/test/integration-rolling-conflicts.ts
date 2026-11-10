import { expect, vi } from 'vitest';
import { sessionCookie } from './integration-harness';
import type { ScenarioContext } from './integration-harness';

export async function checkRollingConflicts(ctx: ScenarioContext) {
  const { request, adminCookie, professionalId, serviceId } = ctx;
    const plannedBeforeAbsence = await request(
      'POST',
      '/schedule/rules',
      {
        patientId: ctx.secondPatientId,
        daysOfWeek: [1],
        effectiveFrom: '2026-11-02',
        effectiveTo: '2026-11-16',
        startMinute: 480,
        endMinute: 540,
        segments: [
          {
            serviceId,
            professionalIds: [professionalId],
            startMinute: 480,
            endMinute: 540,
            modality: 'individual',
          },
        ],
      },
      adminCookie,
    );
    expect(plannedBeforeAbsence.statusCode).toBe(201);
    const multiDayAbsence = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'absence',
        dayOfWeek: null,
        startMinute: 480,
        endMinute: 540,
        effectiveFrom: '2026-11-02',
        effectiveTo: '2026-11-16',
        status: 'active',
      },
      adminCookie,
    );
    expect(multiDayAbsence.statusCode).toBe(201);
    expect(multiDayAbsence.json().issues.map((item: { date: string }) => item.date)).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ]);
    const groupAbsence = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'absence',
        dayOfWeek: null,
        startMinute: 600,
        endMinute: 660,
        effectiveFrom: '2026-11-04',
        effectiveTo: '2026-11-04',
        status: 'active',
      },
      adminCookie,
    );
    expect(groupAbsence.statusCode).toBe(201);
    expect(groupAbsence.json().issues).toHaveLength(2);
    const incompatibleGroupMove = await request(
      'POST',
      `/availability/issues/${groupAbsence.json().issues[0].id}/resolve`,
      {
        action: 'reschedule',
        newDate: '2026-11-05',
        startMinute: 600,
        reason: 'Intento de mover solo un paciente del grupo.',
      },
      adminCookie,
    );
    expect(incompatibleGroupMove.statusCode).toBe(409);
    const rollingConflicts = await request(
      'GET',
      '/schedule/pending-conflicts',
      undefined,
      adminCookie,
    );
    expect(rollingConflicts.statusCode).toBe(200);
    expect(
      rollingConflicts
        .json()
        .conflicts.some((item: { date: string }) => item.date === '2026-11-16'),
    ).toBe(true);
    expect(rollingConflicts.json().from).toBe('2026-10-26');
    expect(rollingConflicts.json().to).toBe('2027-01-17');
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    const renewedLogin = await request('POST', '/auth/login', {
      email: 'admin@test.local',
      password: 'ClaveSegura123',
    });
    const advancedWindow = await request(
      'GET',
      '/schedule/pending-conflicts',
      undefined,
      sessionCookie(renewedLogin.headers['set-cookie']),
    );
    expect(advancedWindow.json().from).toBe('2026-11-01');
    expect(advancedWindow.json().to).toBe('2027-01-23');
}
