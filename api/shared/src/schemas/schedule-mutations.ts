import { z } from 'zod';
import {
  dateOnlySchema,
  idSchema,
  minuteEndSchema,
  minuteStartSchema,
  optionalDateSchema,
  optionalText,
  weekdaySchema,
} from './common';
import { scheduleSegmentInputSchema, validateRuleShape } from './schedule-core';

const uniqueWeekdays = z
  .array(weekdaySchema)
  .min(1, 'Seleccioná al menos un día')
  .max(7)
  .refine((days) => new Set(days).size === days.length, 'No repitas días');

const ruleFieldsSchema = z.object({
  patientId: idSchema,
  daysOfWeek: uniqueWeekdays,
  effectiveFrom: dateOnlySchema,
  effectiveTo: optionalDateSchema,
  startMinute: minuteStartSchema,
  endMinute: minuteEndSchema,
  segments: z.array(scheduleSegmentInputSchema).min(1, 'Agregá al menos una prestación').max(12),
  notes: optionalText(500),
});

const ruleRefinement = (
  value: {
    effectiveFrom: string;
    effectiveTo?: string | null;
    startMinute: number;
    endMinute: number;
    segments: Array<{ startMinute: number; endMinute: number }>;
  },
  ctx: z.RefinementCtx,
) => {
  if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
    ctx.addIssue({
      code: 'custom',
      message: 'La vigencia hasta no puede ser anterior al inicio',
      path: ['effectiveTo'],
    });
  }
  for (const issue of validateRuleShape(value)) {
    ctx.addIssue({ code: 'custom', message: issue.message, path: issue.path.split('.') });
  }
};

export const createScheduleRuleSchema = ruleFieldsSchema.superRefine(ruleRefinement);
export type CreateScheduleRuleInput = z.infer<typeof createScheduleRuleSchema>;

export const futureRulePatchSchema = z
  .object({
    patientId: idSchema.optional(),
    daysOfWeek: uniqueWeekdays.optional(),
    effectiveFrom: dateOnlySchema.optional(),
    effectiveTo: z.union([dateOnlySchema, z.literal(''), z.null()]).optional(),
    startMinute: minuteStartSchema.optional(),
    endMinute: minuteEndSchema.optional(),
    segments: z.array(scheduleSegmentInputSchema).min(1).max(12).optional(),
    notes: z.union([z.string().trim().max(500), z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type FutureRulePatch = z.infer<typeof futureRulePatchSchema>;

export const dateRulePatchSchema = z
  .object({
    startMinute: minuteStartSchema.optional(),
    endMinute: minuteEndSchema.optional(),
    segments: z.array(scheduleSegmentInputSchema).min(1).max(12).optional(),
    notes: optionalText(500),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type DateRulePatch = z.infer<typeof dateRulePatchSchema>;

export const changeScheduleRuleSchema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('date'),
    date: dateOnlySchema,
    expectedVersion: z.number().int().min(1),
    changes: dateRulePatchSchema,
  }),
  z.object({
    scope: z.literal('future'),
    date: dateOnlySchema,
    expectedVersion: z.number().int().min(1),
    changes: futureRulePatchSchema,
  }),
  z.object({
    scope: z.literal('weekday_future'),
    date: dateOnlySchema,
    expectedVersion: z.number().int().min(1),
    changes: futureRulePatchSchema,
  }),
]);
export type ChangeScheduleRuleInput = z.infer<typeof changeScheduleRuleSchema>;

export const changeGroupBlockSchema = z
  .object({
    groupId: idSchema,
    date: dateOnlySchema,
    sourceStartMinute: minuteStartSchema,
    sourceEndMinute: minuteEndSchema,
    startMinute: minuteStartSchema,
    endMinute: minuteEndSchema,
    professionalIds: z
      .array(idSchema)
      .min(1)
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length, 'No repitas profesionales'),
    spaceId: idSchema.nullable(),
    expectedRuleVersions: z.record(z.string(), z.number().int().min(1)),
    reason: z.string().trim().min(5).max(400),
  })
  .refine((value) => value.endMinute > value.startMinute, {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['endMinute'],
  });
export type ChangeGroupBlockInput = z.infer<typeof changeGroupBlockSchema>;

export const finishScheduleRuleSchema = z.object({
  lastDate: dateOnlySchema,
  reason: z.string().trim().min(5).max(400),
});
export type FinishScheduleRuleInput = z.infer<typeof finishScheduleRuleSchema>;

export const cancelScheduleRuleSchema = z.object({
  reason: z.string().trim().min(5).max(400),
});
export type CancelScheduleRuleInput = z.infer<typeof cancelScheduleRuleSchema>;
