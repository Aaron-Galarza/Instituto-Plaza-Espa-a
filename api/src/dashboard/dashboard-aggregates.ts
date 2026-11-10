import {
  type DashboardDailyRow,
  type ScheduleConflict,
  type ScheduleOccurrence,
} from '@plaza/shared';
import { mergedMinutes, peakConcurrentPatients } from '../scheduling/engine';
import type { Interval } from './dashboard-time';

export function collectDashboardData(
  active: ScheduleOccurrence[],
  dates: string[],
  conflicts: ScheduleConflict[],
) {
  // Minutos de paciente: unión por paciente y día.
  const patientDayIntervals = new Map<string, Interval[]>();
  const patientServices = new Map<string, Set<string>>();

  // Minutos profesionales: unión por profesional y día (las sesiones grupales no duplican horas).
  const professionalDayIntervals = new Map<string, Interval[]>();
  const professionalSegments = new Map<string, number>();
  const professionalPatients = new Map<string, Set<string>>();

  // Espacios: minutos de paciente y picos por día.
  const spaceDayPatientIntervals = new Map<string, Interval[]>();
  const spaceDayInstances = new Map<string, Array<Interval & { patientId: string }>>();
  const spaceDays = new Map<string, Set<string>>();

  const serviceSegments = new Map<string, number>();
  const servicePatients = new Map<string, Set<string>>();
  const servicePatientIntervals = new Map<string, Interval[]>();

  const daily = new Map<string, DashboardDailyRow>();
  for (const date of dates) {
    daily.set(date, {
      date,
      journeys: 0,
      patients: 0,
      services: 0,
      maxSimultaneous: 0,
      conflicts: 0,
    });
  }

  const dailyPatientIds = new Map<string, Set<string>>();
  const dailyIntervals = new Map<string, Array<Interval & { patientId: string }>>();

  for (const occurrence of active) {
    const row = daily.get(occurrence.date);
    if (row) {
      row.journeys += 1;
      row.services += occurrence.segments.length;
    }
    const patients = dailyPatientIds.get(occurrence.date) ?? new Set<string>();
    patients.add(occurrence.patientId);
    dailyPatientIds.set(occurrence.date, patients);
    patientServices.set(
      occurrence.patientId,
      new Set([
        ...(patientServices.get(occurrence.patientId) ?? []),
        ...occurrence.segments.map((segment) => segment.serviceId),
      ]),
    );

    const dayIntervals = dailyIntervals.get(occurrence.date) ?? [];
    for (const segment of occurrence.segments) {
      const interval: Interval = {
        startMinute: segment.startMinute,
        endMinute: segment.endMinute,
      };
      dayIntervals.push({ ...interval, patientId: occurrence.patientId });

      const patientKey = `${occurrence.date}|${occurrence.patientId}`;
      patientDayIntervals.set(patientKey, [
        ...(patientDayIntervals.get(patientKey) ?? []),
        interval,
      ]);

      const serviceIntervalKey = `${occurrence.date}|${occurrence.patientId}|${segment.serviceId}`;
      serviceSegments.set(segment.serviceId, (serviceSegments.get(segment.serviceId) ?? 0) + 1);
      servicePatients.set(
        segment.serviceId,
        new Set([...(servicePatients.get(segment.serviceId) ?? []), occurrence.patientId]),
      );
      servicePatientIntervals.set(serviceIntervalKey, [
        ...(servicePatientIntervals.get(serviceIntervalKey) ?? []),
        interval,
      ]);

      for (const professionalId of segment.professionalIds) {
        const professionalKey = `${professionalId}|${occurrence.date}`;
        professionalDayIntervals.set(professionalKey, [
          ...(professionalDayIntervals.get(professionalKey) ?? []),
          interval,
        ]);
        professionalSegments.set(
          professionalId,
          (professionalSegments.get(professionalId) ?? 0) + 1,
        );
        professionalPatients.set(
          professionalId,
          new Set([...(professionalPatients.get(professionalId) ?? []), occurrence.patientId]),
        );
      }

      if (segment.spaceId) {
        const spaceKey = `${occurrence.date}|${segment.spaceId}`;
        const spacePatientKey = `${spaceKey}|${occurrence.patientId}`;
        spaceDayPatientIntervals.set(spacePatientKey, [
          ...(spaceDayPatientIntervals.get(spacePatientKey) ?? []),
          interval,
        ]);
        spaceDayInstances.set(spaceKey, [
          ...(spaceDayInstances.get(spaceKey) ?? []),
          { ...interval, patientId: occurrence.patientId },
        ]);
        const days = spaceDays.get(segment.spaceId) ?? new Set<string>();
        days.add(occurrence.date);
        spaceDays.set(segment.spaceId, days);
      }
    }
    dailyIntervals.set(occurrence.date, dayIntervals);
  }

  let patientMinutes = 0;
  for (const intervals of patientDayIntervals.values()) {
    patientMinutes += mergedMinutes(intervals);
  }

  let professionalMinutes = 0;
  for (const intervals of professionalDayIntervals.values()) {
    professionalMinutes += mergedMinutes(intervals);
  }

  let maxSimultaneousPatients = 0;
  for (const [date, row] of daily) {
    const intervals = dailyIntervals.get(date) ?? [];
    const peak = peakConcurrentPatients(intervals);
    row.maxSimultaneous = peak;
    row.patients = dailyPatientIds.get(date)?.size ?? 0;
    row.conflicts = conflicts.filter(
      (conflict) => conflict.severity === 'error' && conflict.date === date,
    ).length;
    maxSimultaneousPatients = Math.max(maxSimultaneousPatients, peak);
  }

  return {
    patientServices,
    professionalDayIntervals,
    professionalSegments,
    professionalPatients,
    spaceDayPatientIntervals,
    spaceDayInstances,
    spaceDays,
    serviceSegments,
    servicePatients,
    servicePatientIntervals,
    daily,
    patientMinutes,
    professionalMinutes,
    maxSimultaneousPatients,
  };
}
