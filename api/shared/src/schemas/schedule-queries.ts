import { z } from 'zod';
import { dateOnlySchema, idSchema } from './common';
import { scheduleRuleStatusSchema } from './schedule-core';
import { createScheduleRuleSchema } from './schedule-mutations';

export const scheduleQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
    patientId: idSchema.optional(),
    professionalId: idSchema.optional(),
    serviceId: idSchema.optional(),
    spaceId: idSchema.optional(),
    groupId: idSchema.optional(),
    search: z.string().trim().max(120).optional(),
    includeCancelled: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .optional()
      .transform((value) => value === true || value === 'true'),
  })
  .refine((value) => value.from <= value.to, {
    message: 'Rango de fechas inválido',
    path: ['from'],
  });
export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;

export const scheduleRuleQuerySchema = z.object({
  patientId: idSchema.optional(),
  professionalId: idSchema.optional(),
  groupId: idSchema.optional(),
  status: scheduleRuleStatusSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type ScheduleRuleQuery = z.infer<typeof scheduleRuleQuerySchema>;

export const ruleOccurrencesQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((value) => value.from <= value.to, { message: 'Rango inválido', path: ['from'] });

export const validateScheduleRuleSchema = z.object({
  rule: createScheduleRuleSchema,
  ruleId: idSchema.optional(),
});
export type ValidateScheduleRuleInput = z.infer<typeof validateScheduleRuleSchema>;

export const groupOccupancyQuerySchema = z.object({
  date: dateOnlySchema,
});

export const scheduleExceptionsQuerySchema = z.object({
  scheduleRuleId: idSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

// ---------------------------------------------------------------------------
// Vistas de agenda (respuestas)
// ---------------------------------------------------------------------------
