import { z } from 'zod';
import { entityMetaSchema, optionalText, shortTextSchema, statusSchema } from './common';

export const insurerSchema = entityMetaSchema.extend({
  name: z.string().trim().min(1).max(120),
  code: shortTextSchema.nullable().optional(),
  description: shortTextSchema.nullable().optional(),
  status: statusSchema,
});
export type Insurer = z.infer<typeof insurerSchema>;

export const createInsurerSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre').max(120),
  code: optionalText(40),
  description: optionalText(200),
  status: statusSchema.optional().default('active'),
});
export type CreateInsurerInput = z.infer<typeof createInsurerSchema>;

export const updateInsurerSchema = createInsurerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateInsurerInput = z.infer<typeof updateInsurerSchema>;

export const insurerQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
});
export type InsurerQuery = z.infer<typeof insurerQuerySchema>;
