import { expect } from 'vitest';
import { sessionCookie, type ScenarioContext } from './integration-harness';

export async function checkRequestsAndAbsence(ctx: ScenarioContext) {
  const { request, adminCookie, patientId, professionalId, ruleId } = ctx;
    const login = await request('POST', '/auth/login', {
      email: 'profesional@test.local',
      password: 'ClaveSegura123',
    });
    const professionalCookie = sessionCookie(login.headers['set-cookie']);
    expect(
      (
        await request(
          'POST',
          '/schedule/rules',
          {
            patientId,
            daysOfWeek: [1],
            effectiveFrom: '2026-11-09',
            startMinute: 540,
            endMinute: 600,
            segments: [],
          },
          professionalCookie,
        )
      ).statusCode,
    ).toBe(403);
    const changeRequest = await request(
      'POST',
      '/change-requests',
      {
        type: 'cancel_date',
        scheduleRuleId: ruleId,
        date: '2026-11-02',
        reason: 'Necesito cancelar esta fecha.',
      },
      professionalCookie,
    );
    expect(changeRequest.statusCode).toBe(201);
    const requestRecord = changeRequest.json();
    const approval = await request(
      'POST',
      `/change-requests/${requestRecord.id}/approve`,
      {
        note: 'Autorizado por coordinación',
        expectedVersion: requestRecord.version,
      },
      adminCookie,
    );
    expect(approval.statusCode).toBe(201);
    expect(approval.json().status).toBe('approved');
    const updatedAgenda = await request(
      'GET',
      '/schedule?from=2026-11-02&to=2026-11-02&includeCancelled=true',
      undefined,
      adminCookie,
    );
    expect(updatedAgenda.json().occurrences[0].status).toBe('cancelled');

    const absence = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'absence',
        dayOfWeek: null,
        startMinute: 540,
        endMinute: 600,
        effectiveFrom: '2026-10-26',
        effectiveTo: '2026-10-26',
        status: 'active',
      },
      adminCookie,
    );
    expect(absence.statusCode).toBe(201);
    expect(absence.json().issues).toHaveLength(1);
    const issueId = absence.json().issues[0].id as string;
    const invalidMove = await request(
      'POST',
      `/availability/issues/${issueId}/resolve`,
      {
        action: 'reschedule',
        newDate: '2026-10-27',
        startMinute: 540,
        reason: 'Se reprograma por la ausencia del profesional.',
      },
      adminCookie,
    );
    expect(invalidMove.statusCode).toBe(409);
    const pending = await request(
      'GET',
      '/availability/issues?status=pending',
      undefined,
      adminCookie,
    );
    expect(pending.json().some((item: { id: string }) => item.id === issueId)).toBe(true);
    const tuesday = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'regular',
        dayOfWeek: 2,
        startMinute: 480,
        endMinute: 780,
        effectiveFrom: '2026-10-01',
        status: 'active',
      },
      adminCookie,
    );
    expect(tuesday.statusCode).toBe(201);
    const resolution = await request(
      'POST',
      `/availability/issues/${issueId}/resolve`,
      {
        action: 'reschedule',
        newDate: '2026-10-27',
        startMinute: 540,
        reason: 'Se reprograma por la ausencia del profesional.',
      },
      adminCookie,
    );
    expect(resolution.statusCode).toBe(201);
    expect(resolution.json().status).toBe('resolved');
    const moved = await request(
      'GET',
      '/schedule?from=2026-10-27&to=2026-10-27',
      undefined,
      adminCookie,
    );
    expect(moved.json().occurrences).toHaveLength(1);
    expect(moved.json().occurrences[0].patientId).toBe(patientId);

    ctx.professionalCookie = professionalCookie;
}
