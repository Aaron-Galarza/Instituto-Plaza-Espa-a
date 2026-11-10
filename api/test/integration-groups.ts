import { expect } from 'vitest';
import type { ScenarioContext } from './integration-harness';

export async function checkGroupChanges(ctx: ScenarioContext) {
  const { request, adminCookie, patientId, professionalId } = ctx;
    const groupService = await request(
      'POST',
      '/services',
      {
        name: 'Taller grupal',
        allowedModalities: ['group'],
      },
      adminCookie,
    );
    expect(groupService.statusCode).toBe(201);
    const groupRecord = await request(
      'POST',
      '/care-groups',
      {
        name: 'Grupo de prueba',
        serviceId: groupService.json().id,
        professionalIds: [professionalId],
        capacity: 3,
        modality: 'group',
      },
      adminCookie,
    );
    expect(groupRecord.statusCode).toBe(201);
    const secondPatient = await request(
      'POST',
      '/patients',
      {
        firstName: 'Segundo',
        lastName: 'Paciente',
        transportMode: 'none',
      },
      adminCookie,
    );
    expect(secondPatient.statusCode).toBe(201);
    const groupRuleIds: string[] = [];
    for (const groupPatientId of [patientId, secondPatient.json().id as string]) {
      const created = await request(
        'POST',
        '/schedule/rules',
        {
          patientId: groupPatientId,
          daysOfWeek: [3],
          effectiveFrom: '2026-11-04',
          effectiveTo: '2026-11-04',
          startMinute: 540,
          endMinute: 600,
          segments: [
            {
              serviceId: groupService.json().id,
              professionalIds: [professionalId],
              groupId: groupRecord.json().id,
              startMinute: 540,
              endMinute: 600,
              modality: 'group',
            },
          ],
        },
        adminCookie,
      );
      expect(created.statusCode, JSON.stringify(created.json())).toBe(201);
      groupRuleIds.push(created.json().rule.id);
    }
    const patientOnlyGroupEdit = await request(
      'POST',
      `/schedule/rules/${groupRuleIds[0]}/change`,
      {
        scope: 'date',
        date: '2026-11-04',
        expectedVersion: 1,
        changes: {
          startMinute: 600,
          endMinute: 660,
          segments: [
            {
              serviceId: groupService.json().id,
              professionalIds: [professionalId],
              groupId: groupRecord.json().id,
              startMinute: 600,
              endMinute: 660,
              modality: 'group',
            },
          ],
        },
      },
      adminCookie,
    );
    expect(patientOnlyGroupEdit.statusCode).toBe(409);
    const groupChange = await request(
      'POST',
      '/schedule/group-block/change-date',
      {
        groupId: groupRecord.json().id,
        date: '2026-11-04',
        sourceStartMinute: 540,
        sourceEndMinute: 600,
        startMinute: 600,
        endMinute: 660,
        professionalIds: [professionalId],
        spaceId: null,
        expectedRuleVersions: Object.fromEntries(groupRuleIds.map((id) => [id, 1])),
        reason: 'Se mueve el taller completo para todos los pacientes.',
      },
      adminCookie,
    );
    expect(groupChange.statusCode, JSON.stringify(groupChange.json())).toBe(201);
    expect(groupChange.json().changed).toBe(2);
    const changedGroupAgenda = await request(
      'GET',
      `/schedule?from=2026-11-04&to=2026-11-04&groupId=${groupRecord.json().id}`,
      undefined,
      adminCookie,
    );
    expect(changedGroupAgenda.json().occurrences).toHaveLength(2);
    expect(
      changedGroupAgenda
        .json()
        .occurrences.every((item: { segments: Array<{ groupId: string; startMinute: number }> }) =>
          item.segments.some(
            (segment) => segment.groupId === groupRecord.json().id && segment.startMinute === 600,
          ),
        ),
    ).toBe(true);
    const unilateralFutureGroupChange = await request(
      'POST',
      `/schedule/rules/${groupRuleIds[0]}/change`,
      {
        scope: 'future',
        date: '2026-11-04',
        expectedVersion: 1,
        changes: {
          startMinute: 660,
          endMinute: 720,
          segments: [
            {
              serviceId: groupService.json().id,
              professionalIds: [professionalId],
              groupId: groupRecord.json().id,
              startMinute: 660,
              endMinute: 720,
              modality: 'group',
            },
          ],
        },
      },
      adminCookie,
    );
    expect(unilateralFutureGroupChange.statusCode).toBe(409);
    ctx.secondPatientId = secondPatient.json().id as string;
}
