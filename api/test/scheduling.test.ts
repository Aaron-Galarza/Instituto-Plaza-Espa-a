import { describe, expect, it } from 'vitest';
import type {
  CareGroup,
  Patient,
  Professional,
  ProfessionalAvailability,
  ScheduleException,
  ScheduleRule,
  Service,
  Space,
} from '@plaza/shared';
import {
  buildScheduleView,
  expandOccurrences,
  mergedMinutes,
  peakConcurrentPatients,
} from '../src/scheduling/engine';
import type { SchedulingContext } from '../src/scheduling/scheduling.types';
const stamp = '2026-10-01T12:00:00.000Z';
const meta = (id: string) => ({ id, createdAt: stamp, updatedAt: stamp });
const patient = (id: string): Patient => ({
  ...meta(id),
  firstName: id,
  lastName: 'Prueba',
  insurerId: null,
  transportMode: 'none',
  status: 'active',
});
const professional: Professional = {
  ...meta('pro-1'),
  firstName: 'Ana',
  lastName: 'Prueba',
  specialties: ['Kinesiología'],
  color: '#1F5297',
  status: 'active',
};
const service: Service = {
  ...meta('service-1'),
  name: 'Kinesiología',
  allowedModalities: ['individual', 'group'],
  status: 'active',
};
const group: CareGroup = {
  ...meta('group-1'),
  name: 'Grupo',
  serviceId: service.id,
  professionalIds: [professional.id],
  capacity: 2,
  modality: 'group',
  status: 'active',
};
const space: Space = { ...meta('space-1'), name: 'Sala', capacity: 2, status: 'active' };
const regular: ProfessionalAvailability = {
  ...meta('availability-1'),
  professionalId: professional.id,
  kind: 'regular',
  dayOfWeek: 1,
  startMinute: 480,
  endMinute: 780,
  effectiveFrom: '2026-10-01',
  status: 'active',
};
const rule = (
  patientId: string,
  id = `rule-${patientId}`,
  groupId: string | null = null,
): ScheduleRule => ({
  ...meta(id),
  patientId,
  seriesId: id,
  version: 1,
  daysOfWeek: [1],
  effectiveFrom: '2026-10-01',
  effectiveTo: '2026-11-30',
  startMinute: 540,
  endMinute: 600,
  status: 'active',
  segments: [
    {
      id: `segment-${id}`,
      serviceId: service.id,
      professionalIds: [professional.id],
      groupId,
      spaceId: space.id,
      startMinute: 540,
      endMinute: 600,
      modality: groupId ? 'group' : 'individual',
    },
  ],
});
const context = (rules: ScheduleRule[]): SchedulingContext => ({
  rules,
  exceptions: [],
  groups: [group],
  services: [service],
  spaces: [space],
  professionals: [professional],
  patients: [patient('patient-1'), patient('patient-2'), patient('patient-3')],
  insurers: [],
  availability: [regular],
  issues: [],
});

describe('motor de programación', () => {
  it('expande solo los lunes de la regla ISO', () => {
    const occurrences = expandOccurrences(context([rule('patient-1')]), '2026-10-26', '2026-11-03');
    expect(occurrences.map((item) => item.date)).toEqual(['2026-10-26', '2026-11-02']);
  });

  it('aplica cancelaciones y cambios de una fecha sin alterar el resto de la serie', () => {
    const ctx = context([rule('patient-1')]);
    const cancellation: ScheduleException = {
      ...meta('exception-1'),
      scheduleRuleId: ctx.rules[0]!.id,
      date: '2026-10-26',
      type: 'cancelled',
      createdBy: 'admin-1',
    };
    ctx.exceptions.push(cancellation);
    const occurrences = expandOccurrences(ctx, '2026-10-26', '2026-11-02');
    expect(occurrences.map((item) => item.status)).toEqual(['cancelled', 'scheduled']);
    ctx.exceptions[0] = {
      ...cancellation,
      type: 'modified',
      startMinute: 600,
      endMinute: 660,
      segments: [{ ...ctx.rules[0]!.segments[0]!, startMinute: 600, endMinute: 660 }],
    };
    const modified = expandOccurrences(ctx, '2026-10-26', '2026-11-02');
    expect(modified.map((item) => item.startMinute)).toEqual([600, 540]);
  });

  it('permite concurrencia del mismo grupo dentro de la capacidad', () => {
    const ctx = context([
      rule('patient-1', 'rule-1', group.id),
      rule('patient-2', 'rule-2', group.id),
    ]);
    expect(
      buildScheduleView(ctx, '2026-10-26', '2026-10-26').conflicts.filter(
        (item) => item.severity === 'error',
      ),
    ).toEqual([]);
  });

  it('rechaza superar la capacidad simultánea del grupo y del espacio', () => {
    const ctx = context([
      rule('patient-1', 'rule-1', group.id),
      rule('patient-2', 'rule-2', group.id),
      rule('patient-3', 'rule-3', group.id),
    ]);
    const codes = buildScheduleView(ctx, '2026-10-26', '2026-10-26').conflicts.map(
      (item) => item.code,
    );
    expect(codes).toContain('group_capacity_exceeded');
    expect(codes).toContain('space_capacity_exceeded');
  });

  it('detecta la doble reserva individual y la ausencia profesional', () => {
    const ctx = context([rule('patient-1', 'rule-1'), rule('patient-2', 'rule-2')]);
    ctx.availability.push({
      ...meta('absence-1'),
      professionalId: professional.id,
      kind: 'absence',
      dayOfWeek: null,
      startMinute: 550,
      endMinute: 570,
      effectiveFrom: '2026-10-26',
      effectiveTo: '2026-10-26',
      status: 'active',
    });
    const codes = buildScheduleView(ctx, '2026-10-26', '2026-10-26').conflicts.map(
      (item) => item.code,
    );
    expect(codes).toContain('professional_double_booked');
    expect(codes).toContain('professional_unavailable');
  });

  it('detecta dos jornadas solapadas del mismo paciente', () => {
    const ctx = context([rule('patient-1', 'rule-1'), rule('patient-1', 'rule-2')]);
    const codes = buildScheduleView(ctx, '2026-10-26', '2026-10-26').conflicts.map(
      (item) => item.code,
    );
    expect(codes).toContain('patient_overlap');
  });

  it('cuenta intervalos semiabiertos y horas profesionales compartidas una sola vez', () => {
    expect(
      peakConcurrentPatients([
        { patientId: 'a', startMinute: 540, endMinute: 600 },
        { patientId: 'b', startMinute: 600, endMinute: 660 },
      ]),
    ).toBe(1);
    expect(
      mergedMinutes([
        { startMinute: 540, endMinute: 600 },
        { startMinute: 540, endMinute: 600 },
      ]),
    ).toBe(60);
  });
});
