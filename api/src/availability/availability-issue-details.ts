import { type AssignmentIssue, type AssignmentIssueDetail } from '@plaza/shared';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { expandOccurrences } from '../scheduling/engine';

export async function decorateIssues(
  store: DataStore,
  issues: AssignmentIssue[],
): Promise<AssignmentIssueDetail[]> {
  if (issues.length === 0) return [];
  const ctx = await loadSchedulingContext(store);
  const patientMap = new Map(ctx.patients.map((patient) => [patient.id, patient]));
  const professionalMap = new Map(
    ctx.professionals.map((professional) => [professional.id, professional]),
  );
  const ruleMap = new Map(ctx.rules.map((rule) => [rule.id, rule]));
  const dates = [...new Set(issues.map((issue) => issue.date))];
  const occurrences = dates.flatMap((date) => expandOccurrences(ctx, date, date));

  return issues.map((issue) => {
    const occurrence = occurrences.find(
      (item) => item.ruleId === issue.scheduleRuleId && item.date === issue.date,
    );
    const rule = ruleMap.get(issue.scheduleRuleId);
    const segments = occurrence?.segments ?? [];
    const affected = segments.filter((segment) => issue.segmentIds.includes(segment.id));
    const relevant = affected.length > 0 ? affected : segments;
    const fallbackSegments = rule?.segments ?? [];
    const startMinute = relevant.length
      ? Math.min(...relevant.map((segment) => segment.startMinute))
      : (occurrence?.startMinute ?? rule?.startMinute ?? 0);
    const endMinute = relevant.length
      ? Math.max(...relevant.map((segment) => segment.endMinute))
      : (occurrence?.endMinute ?? rule?.endMinute ?? 0);
    const patient = patientMap.get(issue.patientIds[0] ?? '');
    const professional = professionalMap.get(issue.professionalId);
    const serviceNames = relevant.length
      ? [...new Set(relevant.map((segment) => segment.serviceName))]
      : [
          ...new Set(
            fallbackSegments
              .filter((segment) => issue.segmentIds.includes(segment.id))
              .map(
                (segment) =>
                  ctx.services.find((service) => service.id === segment.serviceId)?.name ??
                  'Prestación',
              ),
          ),
        ];
    return {
      ...issue,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente inexistente',
      professionalName: professional
        ? `${professional.firstName} ${professional.lastName}`
        : 'Profesional inexistente',
      serviceNames,
      startMinute,
      endMinute,
      scheduleRuleStatus: rule?.status ?? 'cancelled',
    };
  });
}
