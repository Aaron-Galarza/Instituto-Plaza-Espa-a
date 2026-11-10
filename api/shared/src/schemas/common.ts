import { z } from 'zod';
import { isDateOnly } from '../utils/date';

export const idSchema = z.string().trim().min(1, 'Identificador requerido').max(100);
export const idListSchema = z
  .array(idSchema)
  .max(50)
  .refine((items) => new Set(items).size === items.length, 'No se permiten duplicados');

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado AAAA-MM-DD')
  .refine(isDateOnly, 'Fecha inexistente');

export const minuteStartSchema = z
  .number()
  .int('Debe ser un entero')
  .min(0, 'La hora no puede ser anterior a 00:00')
  .max(1439, 'La hora debe ser anterior a 24:00');

export const minuteEndSchema = z
  .number()
  .int('Debe ser un entero')
  .min(1, 'La hora debe ser posterior a 00:00')
  .max(1440, 'La hora máxima es 24:00');

export const weekdaySchema = z.number().int().min(1).max(7);

export const statusSchema = z.enum(['active', 'inactive']);
export type EntityStatus = z.infer<typeof statusSchema>;
export const entityStatusUpdateSchema = z.object({ status: statusSchema });
export type EntityStatusUpdate = z.infer<typeof entityStatusUpdateSchema>;

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color hexadecimal inválido (ej. #0F766E)');

export const nameSchema = z.string().trim().min(2, 'Mínimo 2 caracteres').max(80);
export const shortTextSchema = z.string().trim().max(160);
export const longTextSchema = z.string().trim().max(2000);
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .optional();

export const optionalDateSchema = z
  .union([dateOnlySchema, z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const entityMetaSchema = z.object({
  id: idSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const versionedEntityMetaSchema = entityMetaSchema.extend({
  version: z.number().int().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export const dateRangeQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((value) => value.from <= value.to, {
    message: 'La fecha desde no puede ser posterior a la fecha hasta',
    path: ['from'],
  });

export const changeReasonSchema = z.string().trim().min(5, 'Indicá un motivo').max(600);
