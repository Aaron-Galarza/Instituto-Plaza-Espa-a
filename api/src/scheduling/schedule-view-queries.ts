import {
  addDays,
  daysBetween,
  todayInInstitutionTz,
  type ScheduleConflict,
  type ScheduleResponse,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { matchesSearch } from '../common/search';
import type { DataStore } from '../database/data-store';
import { attachConflictCounts, buildScheduleView } from './engine';
import { loadSchedulingContext } from './context';

const MAX_VIEW_DAYS = 62;
const VALIDATION_HORIZON_DAYS = 84;

export class ScheduleViewQueries {
  constructor(private readonly store: DataStore) {}
  async getSchedule(
    user: SessionUser,
    filters: {
      from: string;
      to: string;
      patientId?: string;
      professionalId?: string;
      serviceId?: string;
      spaceId?: string;
      groupId?: string;
      search?: string;
      includeCancelled?: boolean;
    },
  ): Promise<ScheduleResponse> {
    if (daysBetween(filters.from, filters.to) > MAX_VIEW_DAYS) {
      throw AppError.validation(`El rango máximo de consulta es de ${MAX_VIEW_DAYS} días.`);
    }
    const ctx = await loadSchedulingContext(this.store);
    const view = buildScheduleView(ctx, filters.from, filters.to);

    const professionalId = user.role === 'professional' ? user.professionalId : null;
    if (user.role === 'professional' && !professionalId) {
      return {
        from: filters.from,
        to: filters.to,
        occurrences: [],
        conflicts: [],
        summary: {
          occurrences: 0,
          patients: 0,
          services: 0,
          professionals: 0,
          errors: 0,
          warnings: 0,
        },
      };
    }

    const occurrences = view.occurrences.filter((occurrence) => {
      if (!filters.includeCancelled && occurrence.status === 'cancelled') return false;
      if (filters.patientId && occurrence.patientId !== filters.patientId) return false;
      if (
        professionalId &&
        !occurrence.segments.some((segment) => segment.professionalIds.includes(professionalId))
      ) {
        return false;
      }
      if (
        filters.professionalId &&
        !occurrence.segments.some((segment) =>
          segment.professionalIds.includes(filters.professionalId!),
        )
      ) {
        return false;
      }
      if (
        filters.serviceId &&
        !occurrence.segments.some((segment) => segment.serviceId === filters.serviceId)
      ) {
        return false;
      }
      if (
        filters.spaceId &&
        !occurrence.segments.some((segment) => segment.spaceId === filters.spaceId)
      ) {
        return false;
      }
      if (
        filters.groupId &&
        !occurrence.segments.some((segment) => segment.groupId === filters.groupId)
      ) {
        return false;
      }
      if (filters.search) {
        const haystack = [
          occurrence.patientName,
          ...occurrence.segments.flatMap((segment) => [
            segment.serviceName,
            segment.groupName ?? '',
            segment.spaceName ?? '',
            ...segment.professionals.map((professional) => professional.name),
          ]),
        ].join(' ');
        if (!matchesSearch(haystack, filters.search)) return false;
      }
      return true;
    });

    const visibleKeys = new Set(occurrences.map((occurrence) => occurrence.key));
    const conflicts = view.conflicts.filter((conflict) => {
      const touchesVisible = conflict.occurrenceKeys.some((key) => visibleKeys.has(key));
      if (professionalId) {
        return touchesVisible && conflict.professionalIds.includes(professionalId);
      }
      return touchesVisible;
    });

    attachConflictCounts(occurrences, conflicts);

    const activeOccurrences = occurrences.filter((occurrence) => occurrence.status !== 'cancelled');
    return {
      from: filters.from,
      to: filters.to,
      occurrences,
      conflicts,
      summary: {
        occurrences: activeOccurrences.length,
        patients: new Set(activeOccurrences.map((occurrence) => occurrence.patientId)).size,
        services: activeOccurrences.reduce(
          (total, occurrence) => total + occurrence.segments.length,
          0,
        ),
        professionals: new Set(
          activeOccurrences.flatMap((occurrence) =>
            occurrence.segments.flatMap((segment) => segment.professionalIds),
          ),
        ).size,
        errors: conflicts.filter((conflict) => conflict.severity === 'error').length,
        warnings: conflicts.filter((conflict) => conflict.severity === 'warning').length,
      },
    };
  }

  async getDay(user: SessionUser, date: string): Promise<ScheduleResponse> {
    return this.getSchedule(user, { from: date, to: date, includeCancelled: true });
  }

  async getConflicts(from: string, to: string): Promise<ScheduleConflict[]> {
    if (daysBetween(from, to) > MAX_VIEW_DAYS) {
      throw AppError.validation(`El rango máximo de consulta es de ${MAX_VIEW_DAYS} días.`);
    }
    const ctx = await loadSchedulingContext(this.store);
    return buildScheduleView(ctx, from, to).conflicts;
  }

  async getPendingConflicts(): Promise<{
    from: string;
    to: string;
    conflicts: ScheduleConflict[];
  }> {
    const from = todayInInstitutionTz();
    const to = addDays(from, VALIDATION_HORIZON_DAYS - 1);
    const ctx = await loadSchedulingContext(this.store);
    const conflicts = buildScheduleView(ctx, from, to).conflicts.filter(
      (item) => item.severity === 'error',
    );
    return { from, to, conflicts };
  }
}
