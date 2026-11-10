import { z } from 'zod';
import { entityMetaSchema, idSchema, nameSchema, statusSchema } from './common';

export const roleSchema = z.enum(['admin', 'professional', 'director']);
export const userStatusSchema = statusSchema;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Correo electrónico inválido')
  .max(160);

export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(200, 'La contraseña es demasiado larga')
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), {
    message: 'La contraseña debe incluir letras y números',
  });

export const userSchema = entityMetaSchema.extend({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
  status: userStatusSchema,
  professionalId: idSchema.nullable().optional(),
  lastLoginAt: z.string().datetime().nullable().optional(),
});
export type User = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  professionalId: idSchema.nullable().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional(),
    professionalId: idSchema.nullable().optional(),
    status: userStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No hay cambios para guardar');
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresá tu contraseña').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const setupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SetupInput = z.infer<typeof setupSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const userQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});
export type UserQuery = z.infer<typeof userQuerySchema>;

export const userStatusSchemaUpdate = z.object({ status: userStatusSchema });
export type UserStatusUpdate = z.infer<typeof userStatusSchemaUpdate>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professional' | 'director';
  permissions: string[];
  professionalId: string | null;
}

export interface AuthResponse {
  user: SessionUser;
}
