import { z } from 'zod';
import {
  dateOnlySchema,
  entityMetaSchema,
  idSchema,
  longTextSchema,
  optionalDateSchema,
  optionalText,
  shortTextSchema,
  statusSchema,
} from './common';

export const transportModeSchema = z.enum(['none', 'own', 'institutional', 'ambulance']);
export type TransportMode = z.infer<typeof transportModeSchema>;

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  none: 'Sin traslado',
  own: 'Por sus medios',
  institutional: 'Traslado institucional',
  ambulance: 'Ambulancia',
};

export const patientSchema = entityMetaSchema.extend({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  document: shortTextSchema.nullable().optional(),
  birthDate: dateOnlySchema.nullable().optional(),
  phone: shortTextSchema.nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional(),
  insurerId: idSchema.nullable(),
  affiliateNumber: shortTextSchema.nullable().optional(),
  transportMode: transportModeSchema,
  adminNotes: longTextSchema.nullable().optional(),
  status: statusSchema,
});
export type Patient = z.infer<typeof patientSchema>;

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresá el nombre').max(80),
  lastName: z.string().trim().min(1, 'Ingresá el apellido').max(80),
  document: optionalText(40),
  birthDate: optionalDateSchema,
  phone: optionalText(40),
  email: z
    .union([z.string().trim().email('Correo inválido').max(160), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  insurerId: z
    .union([idSchema, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  affiliateNumber: optionalText(60),
  transportMode: transportModeSchema.optional().default('none'),
  adminNotes: optionalText(1000),
  status: statusSchema.optional().default('active'),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const patientQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  insurerId: idSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type PatientQuery = z.infer<typeof patientQuerySchema>;

export const patientStatusSchema = z.object({ status: statusSchema });
