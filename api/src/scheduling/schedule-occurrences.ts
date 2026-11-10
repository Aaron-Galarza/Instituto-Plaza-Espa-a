import {
  eachDate,
  isoWeekday,
  type OccurrenceSegment,
  type ScheduleException,
  type ScheduleOccurrence,
  type ScheduleSegment,
} from '@plaza/shared';
import type { SchedulingContext } from './scheduling.types';

function segmentToOccurrence(
  segment: ScheduleSegment | OccurrenceSegment,
  ctx: SchedulingContext,
): OccurrenceSegment {
  const group = segment.groupId
    ? ctx.groups.find((item) => item.id === segment.groupId)
    : undefined;
  const professionalIds =
    segment.professionalIds.length > 0 ? segment.professionalIds : (group?.professionalIds ?? []);
  const professionals = professionalIds
    .map((id) => ctx.professionals.find((professional) => professional.id === id))
    .filter((professional): professional is NonNullable<typeof professional> =>
      Boolean(professional),
    )
    .map((professional) => ({
      id: professional.id,
      name: `${professional.firstName} ${professional.lastName}`,
      color: professional.color,
    }));
  const spaceId = segment.spaceId ?? group?.spaceId ?? null;
  const service = ctx.services.find((item) => item.id === segment.serviceId);
  const space = spaceId ? ctx.spaces.find((item) => item.id === spaceId) : undefined;
  return {
    id: segment.id,
    serviceId: segment.serviceId,
    serviceName: service?.name ?? 'Prestación inexistente',
    modality: segment.modality,
    professionalIds,
    professionals,
    groupId: segment.groupId ?? null,
    groupName: group?.name ?? null,
    spaceId,
    spaceName: space?.name ?? null,
    startMinute: segment.startMinute,
    endMinute: segment.endMinute,
    notes: segment.notes ?? null,
  };
}

export function expandOccurrences(
  ctx: SchedulingContext,
  from: string,
  to: string,
): ScheduleOccurrence[] {
  const dates = eachDate(from, to);
  const exceptionMap = new Map<string, ScheduleException>();
  for (const exception of [...ctx.exceptions].sort((a, b) =>
    a.updatedAt.localeCompare(b.updatedAt),
  )) {
    exceptionMap.set(`${exception.scheduleRuleId}|${exception.date}`, exception);
  }

  const pendingIssues = new Map<string, string[]>();
  for (const issue of ctx.issues) {
    if (issue.status !== 'pending') continue;
    const key = `${issue.scheduleRuleId}|${issue.date}`;
    const list = pendingIssues.get(key) ?? [];
    list.push(issue.id);
    pendingIssues.set(key, list);
  }

  const patientMap = new Map(ctx.patients.map((patient) => [patient.id, patient]));
  const occurrences: ScheduleOccurrence[] = [];

  for (const rule of ctx.rules) {
    if (rule.status !== 'active') continue;
    if (rule.effectiveFrom > to) continue;
    if (rule.effectiveTo && rule.effectiveTo < from) continue;

    for (const date of dates) {
      if (date < rule.effectiveFrom) continue;
      if (rule.effectiveTo && date > rule.effectiveTo) continue;
      if (!rule.daysOfWeek.includes(isoWeekday(date))) continue;

      const exception = exceptionMap.get(`${rule.id}|${date}`);
      let status: ScheduleOccurrence['status'] = 'scheduled';
      let startMinute = rule.startMinute;
      let endMinute = rule.endMinute;
      let segments = rule.segments;
      let exceptionReason: string | null = null;
      let exceptionId: string | null = null;

      if (exception) {
        exceptionId = exception.id;
        exceptionReason = exception.reason ?? null;
        if (exception.type === 'cancelled') {
          status = 'cancelled';
        } else {
          status = 'modified';
          startMinute = exception.startMinute ?? rule.startMinute;
          endMinute = exception.endMinute ?? rule.endMinute;
          segments = exception.segments?.length ? exception.segments : rule.segments;
        }
      }

      const issueIds = pendingIssues.get(`${rule.id}|${date}`) ?? [];
      if (status !== 'cancelled' && issueIds.length > 0) status = 'pending_resolution';

      const patient = patientMap.get(rule.patientId);
      occurrences.push({
        key: `${date}|${rule.id}`,
        date,
        ruleId: rule.id,
        seriesId: rule.seriesId,
        ruleVersion: rule.version,
        patientId: rule.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente inexistente',
        patientStatus: patient?.status ?? 'inactive',
        status,
        startMinute,
        endMinute,
        segments: segments.map((segment) => segmentToOccurrence(segment, ctx)),
        exceptionId,
        exceptionReason,
        issueIds,
        conflictCount: 0,
      });
    }
  }

  occurrences.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.patientName.localeCompare(b.patientName, 'es');
  });

  return occurrences;
}
