import { z } from 'zod';
import {
  dateOnlySchema,
  entityMetaSchema,
  idListSchema,
  idSchema,
  minuteEndSchema,
  minuteStartSchema,
  optionalText,
  weekdaySchema,
} from './common';
import { modalitySchema } from './service';

export const scheduleRuleStatusSchema = z.enum(['active', 'cancelled', 'finished']);
export type ScheduleRuleStatus = z.infer<typeof scheduleRuleStatusSchema>;

export const SCHEDULE_STATUS_LABELS: Record<ScheduleRuleStatus, string> = {
  active: 'Vigente',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
};

export const scheduleSegmentInputSchema = z
  .object({
    id: idSchema.optional(),
    serviceId: idSchema,
    professionalIds: idListSchema.default([]),
    groupId: idSchema.nullable().optional(),
    spaceId: idSchema.nullable().optional(),
    startMinute: minuteStartSchema,
    endMinute: minuteEndSchema,
    modality: modalitySchema,
    notes: optionalText(300),
  })
  .superRefine((segment, ctx) => {
    if (segment.startMinute >= segment.endMinute) {
      ctx.addIssue({
        code: 'custom',
        message: 'El tramo debe terminar después de comenzar',
        path: ['endMinute'],
      });
    }
    if (segment.professionalIds.length === 0 && !segment.groupId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Asigná un profesional o un grupo',
        path: ['professionalIds'],
      });
    }
  });
export type ScheduleSegmentInput = z.infer<typeof scheduleSegmentInputSchema>;

export const scheduleSegmentSchema = z.object({
  id: idSchema,
  serviceId: idSchema,
  professionalIds: idListSchema,
  groupId: idSchema.nullable().optional(),
  spaceId: idSchema.nullable().optional(),
  startMinute: minuteStartSchema,
  endMinute: minuteEndSchema,
  modality: modalitySchema,
  notes: z.string().trim().max(300).nullable().optional(),
});
export type ScheduleSegment = z.infer<typeof scheduleSegmentSchema>;

export const scheduleRuleSchema = entityMetaSchema.extend({
  patientId: idSchema,
  daysOfWeek: z.array(weekdaySchema).min(1).max(7),
  effectiveFrom: dateOnlySchema,
  effectiveTo: dateOnlySchema.nullable().optional(),
  startMinute: minuteStartSchema,
  endMinute: minuteEndSchema,
  segments: z.array(scheduleSegmentSchema).min(1),
  status: scheduleRuleStatusSchema,
  notes: z.string().trim().max(500).nullable().optional(),
  seriesId: idSchema,
  version: z.number().int().min(1),
  supersedesId: idSchema.nullable().optional(),
});
export type ScheduleRule = z.infer<typeof scheduleRuleSchema>;

export function segmentsOverlap(
  a: { startMinute: number; endMinute: number },
  b: { startMinute: number; endMinute: number },
): boolean {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

export interface RuleShapeIssue {
  path: string;
  message: string;
}

export function validateRuleShape(shape: {
  startMinute: number;
  endMinute: number;
  segments: Array<{ startMinute: number; endMinute: number }>;
}): RuleShapeIssue[] {
  const issues: RuleShapeIssue[] = [];
  if (shape.startMinute >= shape.endMinute) {
    issues.push({ path: 'endMinute', message: 'La jornada debe terminar después de comenzar' });
  }
  shape.segments.forEach((segment, index) => {
    if (segment.startMinute < shape.startMinute || segment.endMinute > shape.endMinute) {
      issues.push({
        path: `segments.${index}`,
        message: 'El tramo debe estar contenido en la jornada',
      });
    }
  });
  const ordered = [...shape.segments].sort((a, b) => a.startMinute - b.startMinute);
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (previous && current && segmentsOverlap(previous, current)) {
      issues.push({
        path: 'segments',
        message: 'Dos tramos del mismo paciente se superponen en el tiempo',
      });
      break;
    }
  }
  return issues;
}
