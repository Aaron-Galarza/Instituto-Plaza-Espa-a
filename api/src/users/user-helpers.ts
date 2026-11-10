import { type User } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import type { UserRecord } from '../database/types';

export function toPublicUser(user: UserRecord): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function assertProfessionalLinkAvailable(
  tx: DataStore,
  professionalId: string,
  currentUserId: string | null,
): Promise<void> {
  const professional = await tx.repo('professionals').findById(professionalId);
  if (!professional) throw AppError.validation('El profesional indicado no existe.');
  if (professional.userId && professional.userId !== currentUserId) {
    throw AppError.conflict('Ese profesional ya está vinculado a otro usuario.');
  }
  const linkedUser = await tx
    .repo('users')
    .findOne(
      (user) =>
        user.professionalId === professionalId &&
        (currentUserId === null || user.id !== currentUserId),
    );
  if (linkedUser) {
    throw AppError.conflict('Ese profesional ya está vinculado a otro usuario.');
  }
}
