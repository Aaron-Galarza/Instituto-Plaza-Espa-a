import { formatMinutesRange, intervalsOverlap, isoWeekday } from '@plaza/shared';
import type { SchedulingContext } from './scheduling.types';
import type { AddConflict, Instance } from './conflict-types';

export function checkProfessionalConflicts(
  ctx: SchedulingContext,
  instances: Instance[],
  add: AddConflict,
): void {
  const professionalMap = new Map(ctx.professionals.map((item) => [item.id, item]));
  // Superposición de profesionales: se permite la concurrencia válida de grupo/compartida
  const byProfessionalDate = new Map<string, Instance[]>();
  for (const instance of instances) {
    for (const professionalId of instance.segment.professionalIds) {
      const key = `${instance.occurrence.date}|${professionalId}`;
      const list = byProfessionalDate.get(key) ?? [];
      list.push(instance);
      byProfessionalDate.set(key, list);
    }
  }
  for (const [key, list] of byProfessionalDate) {
    const [date, professionalId] = key.split('|') as [string, string];
    const sorted = [...list].sort((a, b) => a.segment.startMinute - b.segment.startMinute);
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        if (b.segment.startMinute >= a.segment.endMinute) break;
        if (a.occurrence.key === b.occurrence.key) continue;
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
        const sameGroup =
          a.segment.groupId !== null &&
          a.segment.groupId === b.segment.groupId &&
          a.segment.serviceId === b.segment.serviceId;
        const sharedSession =
          a.segment.modality === 'shared' &&
          b.segment.modality === 'shared' &&
          a.segment.serviceId === b.segment.serviceId;
        if (sameGroup || sharedSession) continue;
        const professional = professionalMap.get(professionalId);
        add({
          severity: 'error',
          code: 'professional_double_booked',
          message: `${professional ? `${professional.firstName} ${professional.lastName}` : 'Un profesional'} tiene dos asignaciones simultáneas incompatibles (${a.segment.serviceName} / ${b.segment.serviceName}) a las ${formatMinutesRange(
            Math.max(a.segment.startMinute, b.segment.startMinute),
            Math.min(a.segment.endMinute, b.segment.endMinute),
          )}.`,
          date,
          instances: [a, b],
          extra: `professional-${professionalId}`,
        });
      }
    }
  }

  // Disponibilidad profesional y ausencias (agrupado por profesional y fecha)
  const professionalsWithRegular = new Set(
    ctx.availability
      .filter((entry) => entry.kind === 'regular' && entry.status === 'active')
      .map((entry) => entry.professionalId),
  );

  for (const [key, list] of byProfessionalDate) {
    const [date, professionalId] = key.split('|') as [string, string];
    const professional = professionalMap.get(professionalId);
    if (!professional || professional.status !== 'active') continue;
    const weekday = isoWeekday(date);

    if (!professionalsWithRegular.has(professionalId)) {
      add({
        severity: 'warning',
        code: 'professional_without_availability',
        message: `El profesional ${professional.firstName} ${professional.lastName} no tiene disponibilidad cargada.`,
        date,
        instances: list,
        extra: `no-availability-${professionalId}`,
      });
      continue;
    }

    const entries = ctx.availability.filter(
      (entry) =>
        entry.professionalId === professionalId &&
        entry.status === 'active' &&
        entry.kind === 'regular' &&
        entry.effectiveFrom <= date &&
        (!entry.effectiveTo || entry.effectiveTo >= date) &&
        (entry.dayOfWeek === null || entry.dayOfWeek === weekday),
    );

    const absences = ctx.availability.filter(
      (entry) =>
        entry.professionalId === professionalId &&
        entry.status === 'active' &&
        (entry.kind === 'absence' || entry.kind === 'block') &&
        entry.effectiveFrom <= date &&
        (!entry.effectiveTo || entry.effectiveTo >= date) &&
        (entry.dayOfWeek === null || entry.dayOfWeek === weekday),
    );

    const absentInstances = list.filter((instance) =>
      absences.some((absence) =>
        intervalsOverlap(
          absence.startMinute,
          absence.endMinute,
          instance.segment.startMinute,
          instance.segment.endMinute,
        ),
      ),
    );
    if (absentInstances.length > 0) {
      const start = Math.min(...absentInstances.map((item) => item.segment.startMinute));
      const end = Math.max(...absentInstances.map((item) => item.segment.endMinute));
      add({
        severity: 'error',
        code: 'professional_unavailable',
        message: `${professional.firstName} ${professional.lastName} está ausente o bloqueado en el horario ${formatMinutesRange(start, end)}.`,
        date,
        instances: absentInstances,
        extra: `absence-${professionalId}`,
      });
    }

    const uncovered = list.filter(
      (instance) =>
        !absentInstances.includes(instance) &&
        !entries.some(
          (entry) =>
            entry.startMinute <= instance.segment.startMinute &&
            entry.endMinute >= instance.segment.endMinute,
        ),
    );
    if (uncovered.length > 0) {
      const start = Math.min(...uncovered.map((item) => item.segment.startMinute));
      const end = Math.max(...uncovered.map((item) => item.segment.endMinute));
      add({
        severity: 'error',
        code: 'professional_outside_availability',
        message: `${professional.firstName} ${professional.lastName} está asignado fuera de su disponibilidad (${formatMinutesRange(start, end)}).`,
        date,
        instances: uncovered,
        extra: `outside-availability-${professionalId}`,
      });
    }
  }
}
