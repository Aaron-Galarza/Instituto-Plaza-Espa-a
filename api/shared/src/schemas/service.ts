import { z } from 'zod';
import { entityMetaSchema, idSchema, optionalText, shortTextSchema, statusSchema } from './common';

export const modalitySchema = z.enum(['individual', 'group', 'shared']);
export type Modality = z.infer<typeof modalitySchema>;

export const MODALITY_LABELS: Record<Modality, string> = {
  individual: 'Individual',
  group: 'Grupal',
  shared: 'Compartida',
};

export const MODALITY_DESCRIPTIONS: Record<Modality, string> = {
  individual: 'Un paciente por profesional en el mismo intervalo.',
  group: 'Varios pacientes de un mismo grupo, con capacidad limitada.',
  shared: 'Varios pacientes simultáneos en una prestación compartida.',
};

export const serviceSchema = entityMetaSchema.extend({
  name: z.string().trim().min(1).max(120),
  description: shortTextSchema.nullable().optional(),
  allowedModalities: z.array(modalitySchema).min(1).max(3),
  suggestedDurationMinutes: z.number().int().min(5).max(480).nullable().optional(),
  status: statusSchema,
});
export type Service = z.infer<typeof serviceSchema>;

const uniqueModalities = z
  .array(modalitySchema)
  .min(1, 'Seleccioná al menos una modalidad')
  .max(3)
  .refine((items) => new Set(items).size === items.length, 'No repitas modalidades');

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre').max(120),
  description: optionalText(200),
  allowedModalities: uniqueModalities,
  suggestedDurationMinutes: z
    .union([z.coerce.number().int().min(5).max(480), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  status: statusSchema.optional().default('active'),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const serviceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  modality: modalitySchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});
export type ServiceQuery = z.infer<typeof serviceQuerySchema>;

export const spaceSchema = entityMetaSchema.extend({
  name: z.string().trim().min(1).max(120),
  description: shortTextSchema.nullable().optional(),
  capacity: z.number().int().min(1).max(500),
  status: statusSchema,
});
export type Space = z.infer<typeof spaceSchema>;

export const createSpaceSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre').max(120),
  description: optionalText(200),
  capacity: z.coerce.number().int().min(1, 'La capacidad mínima es 1').max(500),
  status: statusSchema.optional().default('active'),
});
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

export const updateSpaceSchema = createSpaceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

export const spaceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(50),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(100),
});
export type SpaceQuery = z.infer<typeof spaceQuerySchema>;

export const referenceSchema = z.object({
  id: idSchema,
  name: z.string(),
  active: z.boolean(),
});
