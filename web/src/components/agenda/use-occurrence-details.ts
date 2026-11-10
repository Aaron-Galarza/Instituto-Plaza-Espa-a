import { useQuery } from '@tanstack/react-query';
import { type AuditEvent, type PaginatedResult, type ScheduleOccurrence, type ScheduleResponse, type ScheduleRuleDetail } from '@plaza/shared';
import { api } from '@/lib/api';
import { weekRange } from '@/lib/format';

export function useOccurrenceDetails(occurrence: ScheduleOccurrence | null, canWrite: boolean) {
  const selectedWeek = occurrence ? weekRange(occurrence.date) : null;
  const detail = useQuery<ScheduleRuleDetail>({
    queryKey: ['rule', occurrence?.ruleId],
    queryFn: () => api<ScheduleRuleDetail>(`/schedule/rules/${occurrence!.ruleId}`),
    enabled: Boolean(occurrence),
  });
  const patientWeek = useQuery<ScheduleResponse>({
    queryKey: ['patient-week', occurrence?.patientId, selectedWeek?.from],
    queryFn: () =>
      api<ScheduleResponse>(
        `/schedule?from=${selectedWeek!.from}&to=${selectedWeek!.to}&patientId=${occurrence!.patientId}`,
      ),
    enabled: Boolean(occurrence && selectedWeek),
  });
  const patientAudit = useQuery<PaginatedResult<AuditEvent>>({
    queryKey: ['patient-audit', occurrence?.patientId],
    queryFn: () =>
      api<PaginatedResult<AuditEvent>>(
        `/audit?entity=patient&entityId=${occurrence!.patientId}&pageSize=20`,
      ),
    enabled: Boolean(occurrence && canWrite),
  });

  return { detail, patientWeek, patientAudit };
}
