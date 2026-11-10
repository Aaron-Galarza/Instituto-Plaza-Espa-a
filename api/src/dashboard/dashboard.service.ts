import { Inject, Injectable } from '@nestjs/common';
import {
  daysBetween,
  eachDate,
  type DashboardMetrics,
  type DashboardProfessionalRow,
  type DashboardResponse,
  type DashboardServiceRow,
  type DashboardSpaceRow,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AppError } from '../common/errors';
import { loadSchedulingContext } from '../scheduling/context';
import { buildScheduleView, mergedMinutes, peakConcurrentPatients } from '../scheduling/engine';
import { availableMinutes, round1 } from './dashboard-time';
import { collectDashboardData } from './dashboard-aggregates';
import { summarizeInsurers } from './dashboard-insurers';

const MAX_DASHBOARD_DAYS = 366;

@Injectable()
export class DashboardService {
  constructor(@Inject(DATA_STORE) private readonly store: DataStore) {}

  async get(from: string, to: string): Promise<DashboardResponse> {
    if (daysBetween(from, to) > MAX_DASHBOARD_DAYS) {
      throw AppError.validation(`El tablero admite un rango máximo de ${MAX_DASHBOARD_DAYS} días.`);
    }

    const [ctx, requests] = await Promise.all([
      loadSchedulingContext(this.store),
      this.store.repo('changeRequests').all(),
    ]);
    const view = buildScheduleView(ctx, from, to);
    const active = view.occurrences.filter((occurrence) => occurrence.status !== 'cancelled');
    const dates = eachDate(from, to);

    const serviceMap = new Map(ctx.services.map((service) => [service.id, service]));
    const spaceMap = new Map(ctx.spaces.map((space) => [space.id, space]));
    const professionalMap = new Map(
      ctx.professionals.map((professional) => [professional.id, professional]),
    );

    const {
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
    } = collectDashboardData(active, dates, view.conflicts);

    const availableByProfessional = availableMinutes(ctx, dates);
    let availableProfessionalMinutes = 0;
    for (const minutes of availableByProfessional.values()) {
      availableProfessionalMinutes += minutes;
    }

    const byService: DashboardServiceRow[] = [...serviceSegments.entries()]
      .map(([serviceId, segments]) => {
        const patientMinutesForService = [...servicePatientIntervals.entries()]
          .filter(([key]) => key.split('|')[2] === serviceId)
          .reduce((total, [, intervals]) => total + mergedMinutes(intervals), 0);
        return {
          serviceId,
          name: serviceMap.get(serviceId)?.name ?? 'Prestación inexistente',
          segments,
          patients: servicePatients.get(serviceId)?.size ?? 0,
          patientMinutes: patientMinutesForService,
        };
      })
      .sort((a, b) => b.patientMinutes - a.patientMinutes || a.name.localeCompare(b.name, 'es'));

    const byProfessional: DashboardProfessionalRow[] = [...professionalMap.values()]
      .map((professional) => {
        const scheduled = [...professionalDayIntervals.entries()]
          .filter(([key]) => key.split('|')[0] === professional.id)
          .reduce((total, [, intervals]) => total + mergedMinutes(intervals), 0);
        const available = availableByProfessional.get(professional.id) ?? 0;
        return {
          professionalId: professional.id,
          name: `${professional.firstName} ${professional.lastName}`,
          color: professional.color,
          segments: professionalSegments.get(professional.id) ?? 0,
          patients: professionalPatients.get(professional.id)?.size ?? 0,
          scheduledMinutes: scheduled,
          availableMinutes: available,
          utilizationPct: available > 0 ? round1((scheduled / available) * 100) : null,
        };
      })
      .filter((row) => row.scheduledMinutes > 0 || row.availableMinutes > 0)
      .sort(
        (a, b) => b.scheduledMinutes - a.scheduledMinutes || a.name.localeCompare(b.name, 'es'),
      );

    const byInsurer = summarizeInsurers(ctx, active);

    const bySpace: DashboardSpaceRow[] = [...spaceDays.keys()]
      .map((spaceId) => {
        const space = spaceMap.get(spaceId);
        const patientMinutesForSpace = [...spaceDayPatientIntervals.entries()]
          .filter(([key]) => key.split('|')[1] === spaceId)
          .reduce((total, [, intervals]) => total + mergedMinutes(intervals), 0);
        let maxSimultaneous = 0;
        for (const [key, instances] of spaceDayInstances) {
          if (key.split('|')[1] !== spaceId) continue;
          maxSimultaneous = Math.max(maxSimultaneous, peakConcurrentPatients(instances));
        }
        const capacity = space?.capacity ?? 0;
        return {
          spaceId,
          name: space?.name ?? 'Espacio inexistente',
          capacity,
          patientMinutes: patientMinutesForSpace,
          maxSimultaneous,
          peakUtilizationPct: capacity > 0 ? round1((maxSimultaneous / capacity) * 100) : 0,
          daysUsed: spaceDays.get(spaceId)?.size ?? 0,
        };
      })
      .sort((a, b) => b.patientMinutes - a.patientMinutes || a.name.localeCompare(b.name, 'es'));

    const metrics: DashboardMetrics = {
      uniquePatients: new Set(active.map((occurrence) => occurrence.patientId)).size,
      journeys: active.length,
      services: active.reduce((total, occurrence) => total + occurrence.segments.length, 0),
      professionalsWithAssignments: professionalPatients.size,
      patientsWithMultipleServices: [...patientServices.values()].filter((set) => set.size > 1)
        .length,
      patientMinutes,
      professionalMinutes,
      availableProfessionalMinutes,
      maxSimultaneousPatients,
      segmentsWithoutProfessional: active.reduce(
        (total, occurrence) =>
          total +
          occurrence.segments.filter((segment) => segment.professionalIds.length === 0).length,
        0,
      ),
      pendingConflicts: view.conflicts.filter((conflict) => conflict.severity === 'error').length,
      pendingRequests: requests.filter((request) => request.status === 'pending').length,
      scheduleChanges: ctx.exceptions.filter(
        (exception) => exception.date >= from && exception.date <= to,
      ).length,
      cancelledOccurrences: view.occurrences.filter(
        (occurrence) => occurrence.status === 'cancelled',
      ).length,
      pendingIssues: ctx.issues.filter(
        (issue) => issue.status === 'pending' && issue.date >= from && issue.date <= to,
      ).length,
    };

    return {
      from,
      to,
      metrics,
      byService,
      byProfessional,
      byInsurer,
      bySpace,
      daily: [...daily.values()],
      conflicts: view.conflicts,
      pendingIssues: ctx.issues.filter(
        (issue) => issue.status === 'pending' && issue.date >= from && issue.date <= to,
      ),
    };
  }
}
