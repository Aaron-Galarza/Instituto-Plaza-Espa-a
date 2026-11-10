import { z } from 'zod';
import {
  dateOnlySchema,
  entityMetaSchema,
  idSchema,
  minuteEndSchema,
  minuteStartSchema,
  optionalText,
} from './common';
import {
  scheduleSegmentInputSchema,
  scheduleSegmentSchema,
  validateRuleShape,
} from './schedule-core';

export const scheduleExceptionTypeSchema = z.enum(['cancelled', 'modified']);
export type ScheduleExceptionType = z.infer<typeof scheduleExceptionTypeSchema>;

const exceptionFieldsSchema = z.object({
  scheduleRuleId: idSchema,
  date: dateOnlySchema,
  type: scheduleExceptionTypeSchema,
  startMinute: minuteStartSchema.optional(),
  endMinute: minuteEndSchema.optional(),
  segments: z.array(scheduleSegmentInputSchema).min(1).max(12).optional(),
  reason: optionalText(400),
});

export const createScheduleExceptionSchema = exceptionFieldsSchema.superRefine((value, ctx) => {
  if (value.type === 'modified') {
    if (!value.segments || value.segments.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'La modificación requiere tramos',
        path: ['segments'],
      });
    }
    if (value.startMinute === undefined || value.endMinute === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indicá el horario modificado',
        path: ['startMinute'],
      });
    } else if (value.startMinute >= value.endMinute) {
      ctx.addIssue({
        code: 'custom',
        message: 'El horario modificado es inválido',
        path: ['endMinute'],
      });
    }
    if (value.segments && value.startMinute !== undefined && value.endMinute !== undefined) {
      for (const issue of validateRuleShape({
        startMinute: value.startMinute,
        endMinute: value.endMinute,
        segments: value.segments,
      })) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path.split('.') });
      }
    }
  }
});
export type CreateScheduleExceptionInput = z.infer<typeof createScheduleExceptionSchema>;

export const updateScheduleExceptionSchema = z
  .object({
    type: scheduleExceptionTypeSchema.optional(),
    startMinute: minuteStartSchema.optional(),
    endMinute: minuteEndSchema.optional(),
    segments: z.array(scheduleSegmentInputSchema).min(1).max(12).optional(),
    reason: optionalText(400),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateScheduleExceptionInput = z.infer<typeof updateScheduleExceptionSchema>;

export const scheduleExceptionSchema = entityMetaSchema.extend({
  scheduleRuleId: idSchema,
  date: dateOnlySchema,
  type: scheduleExceptionTypeSchema,
  startMinute: minuteStartSchema.nullable().optional(),
  endMinute: minuteEndSchema.nullable().optional(),
  segments: z.array(scheduleSegmentSchema).optional(),
  reason: z.string().nullable().optional(),
  createdBy: idSchema,
});
export type ScheduleException = z.infer<typeof scheduleExceptionSchema>;
