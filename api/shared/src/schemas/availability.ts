import { z } from 'zod';
import {
  dateOnlySchema,
  entityMetaSchema,
  idSchema,
  minuteEndSchema,
  minuteStartSchema,
  optionalDateSchema,
  optionalText,
  statusSchema,
  weekdaySchema,
} from './common';

export const availabilityKindSchema = z.enum(['regular', 'absence', 'block']);
export type AvailabilityKind = z.infer<typeof availabilityKindSchema>;

export const AVAILABILITY_KIND_LABELS: Record<AvailabilityKind, string> = {
  regular: 'Disponibilidad habitual',
  absence: 'Ausencia',
  block: 'Bloqueo horario',
};

export const professionalAvailabilitySchema = entityMetaSchema.extend({
  professionalId: idSchema,
  kind: availabilityKindSchema,
  dayOfWeek: weekdaySchema.nullable(),
  startMinute: minuteStartSchema,
  endMinute: minuteEndSchema,
  effectiveFrom: dateOnlySchema,
  effectiveTo: dateOnlySchema.nullable().optional(),
  status: statusSchema,
  notes: z.string().trim().max(300).nullable().optional(),
});
export type ProfessionalAvailability = z.infer<typeof professionalAvailabilitySchema>;

const availabilityFieldsSchema = z.object({
  professionalId: idSchema,
  kind: availabilityKindSchema,
  dayOfWeek: z
    .union([weekdaySchema, z.null()])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  startMinute: minuteStartSchema,
  endMinute: minuteEndSchema,
  effectiveFrom: dateOnlySchema,
  effectiveTo: optionalDateSchema,
  status: statusSchema.optional().default('active'),
  notes: optionalText(300),
});

export const createAvailabilitySchema = availabilityFieldsSchema.superRefine((value, ctx) => {
  if (value.startMinute >= value.endMinute) {
    ctx.addIssue({
      code: 'custom',
      message: 'La hora de inicio debe ser anterior al fin',
      path: ['startMinute'],
    });
  }
  if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
    ctx.addIssue({
      code: 'custom',
      message: 'La vigencia hasta no puede ser anterior al inicio',
      path: ['effectiveTo'],
    });
  }
  if (value.kind === 'regular' && value.dayOfWeek === null) {
    ctx.addIssue({
      code: 'custom',
      message: 'La disponibilidad habitual requiere un día de la semana',
      path: ['dayOfWeek'],
    });
  }
  if (value.kind === 'regular' && value.endMinute - value.startMinute < 15) {
    ctx.addIssue({
      code: 'custom',
      message: 'La disponibilidad debe durar al menos 15 minutos',
      path: ['startMinute'],
    });
  }
  if (value.kind === 'absence' && value.startMinute >= value.endMinute) {
    ctx.addIssue({ code: 'custom', message: 'Rango de ausencia inválido', path: ['endMinute'] });
  }
  if (value.kind === 'absence' && !value.effectiveTo) {
    ctx.addIssue({
      code: 'custom',
      message: 'La ausencia requiere una fecha de finalización',
      path: ['effectiveTo'],
    });
  }
});
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

export const updateAvailabilitySchema = z
  .object({
    kind: availabilityKindSchema.optional(),
    dayOfWeek: z.union([weekdaySchema, z.null()]).optional(),
    startMinute: minuteStartSchema.optional(),
    endMinute: minuteEndSchema.optional(),
    effectiveFrom: dateOnlySchema.optional(),
    effectiveTo: z
      .union([dateOnlySchema, z.literal(''), z.null()])
      .optional()
      .transform((value) => (value === '' ? null : value))
      .optional(),
    status: statusSchema.optional(),
    notes: optionalText(300),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

export const availabilityQuerySchema = z.object({
  professionalId: idSchema.optional(),
  kind: availabilityKindSchema.optional(),
  status: statusSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export const assignmentIssueStatusSchema = z.enum(['pending', 'resolved', 'dismissed']);
export type AssignmentIssueStatus = z.infer<typeof assignmentIssueStatusSchema>;

export const assignmentIssueSchema = entityMetaSchema.extend({
  kind: z.literal('professional_absence'),
  professionalId: idSchema,
  absenceId: idSchema,
  scheduleRuleId: idSchema,
  date: dateOnlySchema,
  segmentIds: z.array(idSchema),
  patientIds: z.array(idSchema),
  status: assignmentIssueStatusSchema,
  resolution: z.string().nullable().optional(),
  resolvedBy: idSchema.nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
});
export type AssignmentIssue = z.infer<typeof assignmentIssueSchema>;

export interface AssignmentIssueDetail extends AssignmentIssue {
  patientName: string;
  professionalName: string;
  serviceNames: string[];
  startMinute: number;
  endMinute: number;
  scheduleRuleStatus: string;
}

export const resolveIssueSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reassign'),
    professionalId: idSchema,
    reason: z.string().trim().min(5).max(400),
    expectedVersion: z.number().int().min(1).optional(),
  }),
  z.object({
    action: z.literal('cancel_date'),
    reason: z.string().trim().min(5).max(400),
    expectedVersion: z.number().int().min(1).optional(),
  }),
  z.object({
    action: z.literal('reschedule'),
    newDate: dateOnlySchema,
    startMinute: minuteStartSchema,
    reason: z.string().trim().min(5).max(400),
    expectedVersion: z.number().int().min(1).optional(),
  }),
  z.object({
    action: z.literal('dismiss'),
    reason: z.string().trim().min(5).max(400),
  }),
]);
export type ResolveIssueInput = z.infer<typeof resolveIssueSchema>;

export const issueQuerySchema = z.object({
  status: assignmentIssueStatusSchema.optional(),
  professionalId: idSchema.optional(),
  absenceId: idSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});
