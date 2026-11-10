import { z } from 'zod';
import {
  entityMetaSchema,
  idListSchema,
  idSchema,
  optionalText,
  shortTextSchema,
  statusSchema,
} from './common';
import { modalitySchema } from './service';

const groupProfessionals = z
  .array(idSchema)
  .min(1, 'Asigná al menos un profesional')
  .max(50)
  .refine((items) => new Set(items).size === items.length, 'No se permiten duplicados');

export const careGroupSchema = entityMetaSchema.extend({
  name: z.string().trim().min(1).max(120),
  serviceId: idSchema,
  professionalIds: idListSchema,
  spaceId: idSchema.nullable().optional(),
  capacity: z.number().int().min(1).max(200),
  modality: modalitySchema,
  notes: shortTextSchema.nullable().optional(),
  status: statusSchema,
});
export type CareGroup = z.infer<typeof careGroupSchema>;

const careGroupFieldsSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre').max(120),
  serviceId: idSchema,
  professionalIds: groupProfessionals,
  spaceId: z
    .union([idSchema, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  capacity: z.coerce.number().int().min(1, 'La capacidad mínima es 1').max(200),
  modality: modalitySchema,
  notes: optionalText(200),
  status: statusSchema.optional().default('active'),
});

export const createCareGroupSchema = careGroupFieldsSchema.refine(
  (value) => value.modality !== 'individual',
  {
    message: 'Un grupo debe tener modalidad grupal o compartida',
    path: ['modality'],
  },
);
export type CreateCareGroupInput = z.infer<typeof createCareGroupSchema>;

export const updateCareGroupSchema = careGroupFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar')
  .refine((value) => value.modality === undefined || value.modality !== 'individual', {
    message: 'Un grupo debe tener modalidad grupal o compartida',
    path: ['modality'],
  });
export type UpdateCareGroupInput = z.infer<typeof updateCareGroupSchema>;

export const careGroupQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  serviceId: idSchema.optional(),
  professionalId: idSchema.optional(),
  spaceId: idSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});
export type CareGroupQuery = z.infer<typeof careGroupQuerySchema>;
