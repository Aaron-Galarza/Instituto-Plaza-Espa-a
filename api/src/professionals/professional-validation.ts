import { type Professional, type SessionUser } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';

export function sanitizeProfessional(professional: Professional, user: SessionUser): Professional {
  if (user.role !== 'professional') return professional;
  const isSelf = user.professionalId === professional.id;
  const { userId: _userId, ...rest } = professional;
  if (isSelf) return rest;
  const { phone: _phone, email: _email, ...limited } = rest;
  return limited;
}

export async function assertUserLinkAvailable(
  tx: DataStore,
  userId: string,
  currentProfessionalId: string | null,
): Promise<void> {
  const user = await tx.repo('users').findById(userId);
  if (!user) throw AppError.validation('El usuario indicado no existe.');
  if (user.role !== 'professional') {
    throw AppError.validation('Sólo se puede vincular un usuario con rol Profesional.');
  }
  if (user.professionalId && user.professionalId !== currentProfessionalId) {
    throw AppError.conflict('Ese usuario ya está vinculado a otro profesional.');
  }
  const other = await tx
    .repo('professionals')
    .findOne(
      (professional) => professional.userId === userId && professional.id !== currentProfessionalId,
    );
  if (other) throw AppError.conflict('Ese usuario ya está vinculado a otro profesional.');
}
