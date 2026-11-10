import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function checkSeriesSplit(ctx: ScenarioContext) {
  const { request, adminCookie, patientId, professionalId, serviceId } = ctx;
    const wednesdayAvailability = await request(
      'POST',
      '/availability',
      {
        professionalId,
        kind: 'regular',
        dayOfWeek: 3,
        startMinute: 480,
        endMinute: 780,
        effectiveFrom: '2026-10-01',
        status: 'active',
      },
      adminCookie,
    );
    expect(wednesdayAvailability.statusCode).toBe(201);
    const twiceWeekly = await request(
      'POST',
      '/schedule/rules',
      {
        patientId,
        daysOfWeek: [1, 3],
        effectiveFrom: '2026-11-02',
        effectiveTo: '2026-11-18',
        startMinute: 660,
        endMinute: 720,
        segments: [
          {
            serviceId,
            professionalIds: [professionalId],
            startMinute: 660,
            endMinute: 720,
            modality: 'individual',
          },
        ],
      },
      adminCookie,
    );
    expect(twiceWeekly.statusCode, JSON.stringify(twiceWeekly.json())).toBe(201);
    const wednesdayException = await request(
      'POST',
      `/schedule/rules/${twiceWeekly.json().rule.id}/change`,
      {
        scope: 'date',
        date: '2026-11-11',
        expectedVersion: 1,
        changes: { notes: 'Excepción del miércoles conservada al dividir la serie.' },
      },
      adminCookie,
    );
    expect(wednesdayException.statusCode).toBe(201);
    const split = await request(
      'POST',
      `/schedule/rules/${twiceWeekly.json().rule.id}/change`,
      {
        scope: 'weekday_future',
        date: '2026-11-09',
        expectedVersion: 1,
        changes: {
          startMinute: 720,
          endMinute: 780,
          segments: [
            {
              serviceId,
              professionalIds: [professionalId],
              startMinute: 720,
              endMinute: 780,
              modality: 'individual',
            },
          ],
        },
      },
      adminCookie,
    );
    expect(split.statusCode).toBe(201);
    expect(split.json().rule.daysOfWeek).toEqual([1]);
    const splitAgenda = await request(
      'GET',
      '/schedule?from=2026-11-09&to=2026-11-11',
      undefined,
      adminCookie,
    );
    const selectedMonday = splitAgenda
      .json()
      .occurrences.find((item: { ruleId: string }) => item.ruleId === split.json().rule.id);
    const unchangedWednesday = splitAgenda
      .json()
      .occurrences.find(
        (item: { date: string; startMinute: number }) =>
          item.date === '2026-11-11' && item.startMinute === 660,
      );
    expect(selectedMonday.startMinute).toBe(720);
    expect(unchangedWednesday).toBeDefined();
    expect(unchangedWednesday.status).toBe('modified');

}
