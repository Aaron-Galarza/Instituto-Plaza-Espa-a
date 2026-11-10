import { type DashboardInsurerRow, type ScheduleOccurrence } from '@plaza/shared';
import type { SchedulingContext } from '../scheduling/scheduling.types';

export function summarizeInsurers(
  ctx: SchedulingContext,
  active: ScheduleOccurrence[],
): DashboardInsurerRow[] {
  const patientMap = new Map(ctx.patients.map((patient) => [patient.id, patient]));
  const insurerMap = new Map(ctx.insurers.map((insurer) => [insurer.id, insurer]));
  const insurerRows = new Map<
    string,
    {
      insurerId: string | null;
      name: string;
      patients: Set<string>;
      journeys: number;
      services: number;
    }
  >();
  for (const occurrence of active) {
    const insurerId = patientMap.get(occurrence.patientId)?.insurerId ?? null;
    const key = insurerId ?? '__none__';
    const row = insurerRows.get(key) ?? {
      insurerId,
      name: insurerId
        ? (insurerMap.get(insurerId)?.name ?? 'Obra social inexistente')
        : 'Sin obra social',
      patients: new Set<string>(),
      journeys: 0,
      services: 0,
    };
    row.patients.add(occurrence.patientId);
    row.journeys += 1;
    row.services += occurrence.segments.length;
    insurerRows.set(key, row);
  }
  const byInsurer: DashboardInsurerRow[] = [...insurerRows.values()]
    .map((row) => ({
      insurerId: row.insurerId,
      name: row.name,
      patients: row.patients.size,
      journeys: row.journeys,
      services: row.services,
    }))
    .sort((a, b) => b.journeys - a.journeys || a.name.localeCompare(b.name, 'es'));

  return byInsurer;
}
