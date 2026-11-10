import { formatMinutesRange, intervalsOverlap } from '@plaza/shared';
import type { SchedulingContext } from './scheduling.types';
import type { AddConflict, Instance } from './conflict-types';
import { peakConcurrentPatients } from './schedule-metrics';

export function checkPatientAndCapacity(
  ctx: SchedulingContext,
  instances: Instance[],
  add: AddConflict,
): void {
  const spaceMap = new Map(ctx.spaces.map((item) => [item.id, item]));
  const groupMap = new Map(ctx.groups.map((item) => [item.id, item]));
  // Superposición de pacientes
  const byPatientDate = new Map<string, Instance[]>();
  for (const instance of instances) {
    const key = `${instance.occurrence.date}|${instance.occurrence.patientId}`;
    const list = byPatientDate.get(key) ?? [];
    list.push(instance);
    byPatientDate.set(key, list);
  }
  for (const list of byPatientDate.values()) {
    const sorted = [...list].sort((a, b) => a.segment.startMinute - b.segment.startMinute);
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        if (b.segment.startMinute >= a.segment.endMinute) break;
        if (
          !intervalsOverlap(
            a.segment.startMinute,
            a.segment.endMinute,
            b.segment.startMinute,
            b.segment.endMinute,
          )
        ) {
          continue;
        }
        const duplicate =
          a.segment.groupId !== null &&
          a.segment.groupId === b.segment.groupId &&
          a.segment.serviceId === b.segment.serviceId;
        add({
          severity: 'error',
          code: duplicate ? 'patient_duplicate' : 'patient_overlap',
          message: duplicate
            ? `${a.occurrence.patientName} tiene la misma prestación grupal asignada más de una vez a las ${formatMinutesRange(a.segment.startMinute, a.segment.endMinute)}.`
            : `${a.occurrence.patientName} tiene prestaciones superpuestas a las ${formatMinutesRange(
                Math.max(a.segment.startMinute, b.segment.startMinute),
                Math.min(a.segment.endMinute, b.segment.endMinute),
              )}.`,
          date: a.occurrence.date,
          instances: [a, b],
          extra: 'patient-overlap',
        });
      }
    }
  }

  // Capacidad de espacios
  const bySpaceDate = new Map<string, Instance[]>();
  for (const instance of instances) {
    if (!instance.segment.spaceId) continue;
    const key = `${instance.occurrence.date}|${instance.segment.spaceId}`;
    const list = bySpaceDate.get(key) ?? [];
    list.push(instance);
    bySpaceDate.set(key, list);
  }
  for (const [key, list] of bySpaceDate) {
    const [date, spaceId] = key.split('|') as [string, string];
    const space = spaceMap.get(spaceId);
    if (!space) continue;
    const peak = peakConcurrentPatients(
      list.map((item) => ({
        startMinute: item.segment.startMinute,
        endMinute: item.segment.endMinute,
        patientId: item.occurrence.patientId,
      })),
    );
    if (peak > space.capacity) {
      add({
        severity: 'error',
        code: 'space_capacity_exceeded',
        message: `El espacio "${space.name}" supera su capacidad (${peak} pacientes simultáneos; capacidad ${space.capacity}).`,
        date,
        instances: list,
        extra: `space-capacity-${peak}`,
      });
    }
  }

  // Capacidad de grupos
  const byGroupDate = new Map<string, Instance[]>();
  for (const instance of instances) {
    if (!instance.segment.groupId) continue;
    const key = `${instance.occurrence.date}|${instance.segment.groupId}`;
    const list = byGroupDate.get(key) ?? [];
    list.push(instance);
    byGroupDate.set(key, list);
  }
  for (const [key, list] of byGroupDate) {
    const [date, groupId] = key.split('|') as [string, string];
    const group = groupMap.get(groupId);
    if (!group) continue;
    const peak = peakConcurrentPatients(
      list.map((item) => ({
        startMinute: item.segment.startMinute,
        endMinute: item.segment.endMinute,
        patientId: item.occurrence.patientId,
      })),
    );
    if (peak > group.capacity) {
      add({
        severity: 'error',
        code: 'group_capacity_exceeded',
        message: `El grupo "${group.name}" supera su capacidad (${peak} pacientes simultáneos; capacidad ${group.capacity}).`,
        date,
        instances: list,
        extra: `group-capacity-${peak}`,
      });
    }
  }
}
