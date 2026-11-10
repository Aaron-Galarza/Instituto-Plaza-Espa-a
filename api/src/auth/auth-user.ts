import { ROLE_PERMISSIONS, type SessionUser, type User } from '@plaza/shared';
import type { UserRecord } from '../database/types';

export function toSessionUser(user: UserRecord | User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: [...ROLE_PERMISSIONS[user.role]],
    professionalId: user.professionalId ?? null,
  };
}
