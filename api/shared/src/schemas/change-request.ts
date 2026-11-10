import { z } from 'zod';
import {
  dateOnlySchema,
  entityMetaSchema,
  idSchema,
  minuteEndSchema,
  minuteStartSchema,
  optionalText,
} from './common';
import { scheduleSegmentInputSchema } from './schedule';

export const changeRequestStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
export type ChangeRequestStatus = z.infer<typeof changeRequestStatusSchema>;

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};

export const changeRequestProposalSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cancel_date'),
    scheduleRuleId: idSchema,
    date: dateOnlySchema,
  }),
  z.object({
    type: z.literal('modify_date'),
    scheduleRuleId: idSchema,
    date: dateOnlySchema,
    startMinute: minuteStartSchema,
    endMinute: minuteEndSchema,
    segments: z.array(scheduleSegmentInputSchema).min(1).max(12),
  }),
  z.object({
    type: z.literal('reassign_professional'),
    scheduleRuleId: idSchema,
    date: dateOnlySchema,
    segmentId: idSchema,
    professionalId: idSchema,
  }),
  z.object({
    type: z.literal('change_space'),
    scheduleRuleId: idSchema,
    date: dateOnlySchema,
    segmentId: idSchema,
    spaceId: idSchema.nullable(),
  }),
]);
export type ChangeRequestProposal = z.infer<typeof changeRequestProposalSchema>;

export const changeRequestTypeSchema = z.enum([
  'cancel_date',
  'modify_date',
  'reassign_professional',
  'change_space',
]);
export type ChangeRequestType = z.infer<typeof changeRequestTypeSchema>;

export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  cancel_date: 'Cancelar una fecha',
  modify_date: 'Modificar una fecha',
  reassign_professional: 'Reasignar profesional',
  change_space: 'Cambiar espacio',
};

export const createChangeRequestSchema = z.intersection(
  changeRequestProposalSchema,
  z.object({
    reason: z.string().trim().min(5, 'Explicá el motivo de la solicitud').max(600),
  }),
);
export type CreateChangeRequestInput = z.infer<typeof createChangeRequestSchema>;

export const adjustChangeRequestSchema = z.intersection(
  createChangeRequestSchema,
  z.object({ expectedVersion: z.number().int().min(1) }),
);
export type AdjustChangeRequestInput = z.infer<typeof adjustChangeRequestSchema>;

export const changeRequestSchema = entityMetaSchema.extend({
  requesterId: idSchema,
  requesterName: z.string(),
  resourceType: z.literal('scheduleRule'),
  resourceId: idSchema,
  type: changeRequestTypeSchema,
  proposal: changeRequestProposalSchema,
  reason: z.string(),
  status: changeRequestStatusSchema,
  resolutionNote: z.string().nullable().optional(),
  resolvedBy: idSchema.nullable().optional(),
  resolvedByName: z.string().nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  version: z.number().int().min(1),
});
export type ChangeRequest = z.infer<typeof changeRequestSchema>;

export const resolveChangeRequestSchema = z.object({
  note: z.string().trim().min(3, 'Indicá una nota de resolución').max(600),
  expectedVersion: z.number().int().min(1),
});
export type ResolveChangeRequestInput = z.infer<typeof resolveChangeRequestSchema>;

export const changeRequestQuerySchema = z.object({
  status: changeRequestStatusSchema.optional(),
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
  type: changeRequestTypeSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const cancelChangeRequestSchema = z.object({
  note: optionalText(600),
});
export type CancelChangeRequestInput = z.infer<typeof cancelChangeRequestSchema>;

export const CHANGE_REQUEST_SCOPE_NOTE =
  'Las solicitudes aplican a una fecha concreta. Si surge un conflicto al aprobar, la solicitud permanece pendiente y la agenda no cambia.';
