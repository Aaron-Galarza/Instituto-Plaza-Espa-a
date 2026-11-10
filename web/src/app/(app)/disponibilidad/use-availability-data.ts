import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AssignmentIssueDetail, ProfessionalAvailability } from '@plaza/shared';
import { useReferenceData } from '@/lib/queries';
import { ApiError, api, queryString } from '@/lib/api';
import type { IssueStatusFilter } from './availability-form';

// La web puede quedar lista unos segundos antes que la API al iniciar pnpm dev.
const retryRead = (failures: number, error: unknown) =>
  failures < 5 && (!(error instanceof ApiError) || error.status >= 500);
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 4000);

export function useAvailabilityData(professionalId: string, status: string, absenceKind: string, issueStatus: IssueStatusFilter, absenceFilter: { id: string; label: string } | null, canRead: boolean) {
  const reference = useReferenceData();
  const professionals = useMemo(
    () =>
      [...(reference.data?.professionals ?? [])].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'es'),
      ),
    [reference.data?.professionals],
  );

  const professionalName = (id: string) => {
    const professional = professionals.find((item) => item.id === id);
    return professional
      ? `${professional.firstName} ${professional.lastName}`
      : 'Profesional inexistente';
  };

  const availability = useQuery<ProfessionalAvailability[]>({
    queryKey: ['availability', professionalId, status],
    queryFn: () =>
      api<ProfessionalAvailability[]>(`/availability${queryString({ professionalId, status })}`),
    enabled: canRead,
    retry: retryRead,
    retryDelay,
  });

  const issues = useQuery<AssignmentIssueDetail[]>({
    queryKey: ['availability-issues', professionalId],
    queryFn: () =>
      api<AssignmentIssueDetail[]>(`/availability/issues${queryString({ professionalId })}`),
    enabled: canRead,
    retry: retryRead,
    retryDelay,
  });

  const regularEntries = useMemo(
    () =>
      (availability.data ?? [])
        .filter((entry) => entry.kind === 'regular')
        .sort(
          (a, b) =>
            (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0) ||
            a.startMinute - b.startMinute ||
            professionalName(a.professionalId).localeCompare(
              professionalName(b.professionalId),
              'es',
            ),
        ),
    [availability.data, professionals],
  );

  const absenceEntries = useMemo(
    () =>
      (availability.data ?? [])
        .filter((entry) => entry.kind !== 'regular')
        .filter((entry) => !absenceKind || entry.kind === absenceKind)
        .sort(
          (a, b) =>
            b.effectiveFrom.localeCompare(a.effectiveFrom) ||
            a.professionalId.localeCompare(b.professionalId),
        ),
    [availability.data, absenceKind],
  );

  const filteredIssues = useMemo(
    () =>
      (issues.data ?? []).filter((issue) => {
        if (issueStatus !== 'all' && issue.status !== issueStatus) return false;
        if (absenceFilter && issue.absenceId !== absenceFilter.id) return false;
        return true;
      }),
    [issues.data, issueStatus, absenceFilter],
  );

  const pendingIssueCount = (issues.data ?? []).filter(
    (issue) => issue.status === 'pending',
  ).length;
  const activeRegularCount = regularEntries.filter((entry) => entry.status === 'active').length;
  const activeAbsenceCount = (availability.data ?? []).filter(
    (entry) => entry.kind !== 'regular' && entry.status === 'active',
  ).length;

  return { professionals, professionalName, availability, issues, regularEntries, absenceEntries, filteredIssues, pendingIssueCount, activeRegularCount, activeAbsenceCount };
}
