import { z } from 'zod';
import {
  entityMetaSchema,
  hexColorSchema,
  idSchema,
  longTextSchema,
  optionalText,
  shortTextSchema,
  statusSchema,
} from './common';

export const professionalSchema = entityMetaSchema.extend({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  specialties: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  color: hexColorSchema,
  phone: shortTextSchema.nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional(),
  userId: idSchema.nullable().optional(),
  status: statusSchema,
});
export type Professional = z.infer<typeof professionalSchema>;

export const createProfessionalSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresá el nombre').max(80),
  lastName: z.string().trim().min(1, 'Ingresá el apellido').max(80),
  specialties: z
    .union([z.array(z.string().trim().min(1).max(80)), z.string()])
    .transform((value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : value,
    )
    .pipe(z.array(z.string().min(1).max(80)).min(1, 'Indicá al menos una especialidad').max(10)),
  color: hexColorSchema,
  phone: optionalText(40),
  email: z
    .union([z.string().trim().email('Correo inválido').max(160), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  userId: z
    .union([idSchema, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  status: statusSchema.optional().default('active'),
});
export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;

export const updateProfessionalSchema = createProfessionalSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;

export const professionalQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  userId: idSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type ProfessionalQuery = z.infer<typeof professionalQuerySchema>;

export const professionalStatusSchema = z.object({ status: statusSchema });

export const professionalSummarySchema = z.object({
  id: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  color: z.string(),
  specialties: z.array(z.string()),
  status: statusSchema,
});
export type ProfessionalSummary = z.infer<typeof professionalSummarySchema>;

export const professionalDetailSchema = professionalSchema.extend({
  availability: z.array(z.lazy(() => z.any())).optional(),
  groups: z.array(z.lazy(() => z.any())).optional(),
  notes: longTextSchema.nullable().optional(),
});
