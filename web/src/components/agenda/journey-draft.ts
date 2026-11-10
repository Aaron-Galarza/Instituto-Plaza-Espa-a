import {
  minutesToTime,
  timeToMinutes,
  type CareGroup,
  type CreateScheduleRuleInput,
  type Modality,
  type Patient,
  type Professional,
  type ScheduleRule,
  type ScheduleSegment,
  type Service,
  type Space,
} from '@plaza/shared';

export interface DraftSegment {
  id?: string;
  serviceId: string;
  professionalIds: string[];
  groupId: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  modality: Modality;
}

export interface JourneyDraft {
  patientId: string;
  daysOfWeek: number[];
  effectiveFrom: string;
  effectiveTo: string;
  startTime: string;
  endTime: string;
  notes: string;
  segments: DraftSegment[];
}

export type JourneyMode = 'create' | 'date' | 'future';

export interface JourneyReference {
  patients: Patient[];
  professionals: Professional[];
  services: Service[];
  spaces: Space[];
  groups: CareGroup[];
}

function safeMinutes(value: string, fallback: number): number {
  try {
    return timeToMinutes(value);
  } catch {
    return fallback;
  }
}

export function emptyDraft(date: string, reference: JourneyReference): JourneyDraft {
  const service = reference.services.find((item) => item.status === 'active');
  const modality = service?.allowedModalities[0] ?? 'individual';
  return {
    patientId: '',
    daysOfWeek: [isoWeekdayFor(date)],
    effectiveFrom: date,
    effectiveTo: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    segments: [
      {
        serviceId: service?.id ?? '',
        professionalIds: [],
        groupId: '',
        spaceId: '',
        startTime: '09:00',
        endTime: '10:00',
        modality,
      },
    ],
  };
}

export function draftFromRule(
  rule: ScheduleRule,
  date: string,
  mode: 'date' | 'future',
  reference: JourneyReference,
): JourneyDraft {
  return {
    patientId: rule.patientId,
    daysOfWeek: [...rule.daysOfWeek],
    effectiveFrom: mode === 'future' ? date : rule.effectiveFrom,
    effectiveTo: rule.effectiveTo ?? '',
    startTime: minutesToTime(rule.startMinute),
    endTime: minutesToTime(rule.endMinute),
    notes: rule.notes ?? '',
    segments:
      rule.segments.length > 0
        ? rule.segments.map((segment) => ({
            id: segment.id,
            serviceId: segment.serviceId,
            professionalIds: [...segment.professionalIds],
            groupId: segment.groupId ?? '',
            spaceId: segment.spaceId ?? '',
            startTime: minutesToTime(segment.startMinute),
            endTime: minutesToTime(segment.endMinute),
            modality: segment.modality,
          }))
        : emptyDraft(date, reference).segments,
  };
}

export function draftToRuleInput(draft: JourneyDraft): CreateScheduleRuleInput {
  const startMinute = safeMinutes(draft.startTime, 0);
  const endMinute = safeMinutes(draft.endTime, 1);
  const segments = draft.segments.map((segment, index) => ({
    ...(segment.id ? { id: segment.id } : {}),
    serviceId: segment.serviceId,
    professionalIds: segment.professionalIds,
    groupId: segment.groupId || null,
    spaceId: segment.spaceId || null,
    startMinute: safeMinutes(segment.startTime, startMinute),
    endMinute: safeMinutes(segment.endTime, endMinute),
    modality: segment.modality,
    ...(index === 0 && draft.notes ? { notes: draft.notes } : {}),
  }));
  return {
    patientId: draft.patientId,
    daysOfWeek: draft.daysOfWeek,
    effectiveFrom: draft.effectiveFrom,
    ...(draft.effectiveTo ? { effectiveTo: draft.effectiveTo } : {}),
    startMinute,
    endMinute,
    segments,
    ...(draft.notes ? { notes: draft.notes } : {}),
  };
}

function isoWeekdayFor(date: string): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function draftSegmentsForDate(
  segments: ScheduleSegment[] | undefined,
  draft: JourneyDraft,
): DraftSegment[] {
  if (segments && segments.length > 0) {
    return segments.map((segment) => ({
      id: segment.id,
      serviceId: segment.serviceId,
      professionalIds: [...segment.professionalIds],
      groupId: segment.groupId ?? '',
      spaceId: segment.spaceId ?? '',
      startTime: minutesToTime(segment.startMinute),
      endTime: minutesToTime(segment.endMinute),
      modality: segment.modality,
    }));
  }
  return draft.segments;
}
