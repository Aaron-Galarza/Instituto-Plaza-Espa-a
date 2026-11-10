import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function checkRequestAdjustment(ctx: ScenarioContext) {
  const { request, adminCookie, patientId, professionalId, serviceId } = ctx;
    const anotherRule = await request(
      'POST',
      '/schedule/rules',
      {
        patientId,
        daysOfWeek: [1],
        effectiveFrom: '2026-11-09',
        effectiveTo: '2026-11-16',
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
    expect(anotherRule.statusCode).toBe(201);
    const nextRuleId = anotherRule.json().rule.id as string;
    const futureChange = await request(
      'POST',
      `/schedule/rules/${nextRuleId}/change`,
      {
        scope: 'future',
        date: '2026-11-16',
        expectedVersion: 1,
        changes: {
          startMinute: 600,
          endMinute: 660,
          segments: [
            {
              serviceId,
              professionalIds: [professionalId],
              startMinute: 600,
              endMinute: 660,
              modality: 'individual',
            },
          ],
        },
      },
      adminCookie,
    );
    expect(futureChange.statusCode).toBe(201);
    expect(futureChange.json().rule.version).toBe(2);
    const series = await request('GET', `/schedule/rules/${nextRuleId}`, undefined, adminCookie);
    expect(series.json().series).toHaveLength(2);
    expect(series.json().series[0].effectiveTo).toBe('2026-11-15');

    const indefiniteAbsence = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'absence',
        startMinute: 540,
        endMinute: 600,
        effectiveFrom: '2026-11-09',
      },
      adminCookie,
    );
    expect(indefiniteAbsence.statusCode).toBe(422);

    const activeDate = await request(
      'GET',
      '/schedule?from=2026-11-09&to=2026-11-09',
      undefined,
      adminCookie,
    );
    const segmentId = activeDate.json().occurrences[0].segments[0].id as string;
    const pendingRequest = await request(
      'POST',
      '/change-requests',
      {
        type: 'reassign_professional',
        scheduleRuleId: nextRuleId,
        date: '2026-11-09',
        segmentId,
        professionalId: randomUUID(),
        reason: 'Solicito cambio de profesional para esta jornada.',
      },
      adminCookie,
    );
    expect(pendingRequest.statusCode).toBe(201);
    const pendingId = pendingRequest.json().id as string;
    const failedApproval = await request(
      'POST',
      `/change-requests/${pendingId}/approve`,
      { expectedVersion: 1, note: 'Intento de aprobación' },
      adminCookie,
    );
    expect(failedApproval.statusCode).toBeGreaterThanOrEqual(400);
    const unchangedRequest = await request(
      'GET',
      `/change-requests/${pendingId}`,
      undefined,
      adminCookie,
    );
    expect(unchangedRequest.json().status).toBe('pending');
    expect(unchangedRequest.json().version).toBe(1);
    const adjustedRequest = await request('PATCH', `/change-requests/${pendingId}`, {
      type: 'reassign_professional',
      scheduleRuleId: nextRuleId,
      date: '2026-11-09',
      segmentId,
      professionalId,
      reason: 'Se ajusta a un profesional disponible para esta fecha.',
      expectedVersion: 1,
    }, adminCookie);
    expect(adjustedRequest.statusCode).toBe(200);
    expect(adjustedRequest.json().status).toBe('pending');
    expect(adjustedRequest.json().version).toBe(2);
    const revisedApproval = await request(
      'POST',
      `/change-requests/${pendingId}/approve`,
      {
        expectedVersion: 2,
        note: 'Propuesta corregida y autorizada',
      },
      adminCookie,
    );
    expect(revisedApproval.statusCode).toBe(201);
    expect(revisedApproval.json().status).toBe('approved');

}
