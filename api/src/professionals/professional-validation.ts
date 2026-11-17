import { type Professional, type SessionUser } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { normalizeForSearch } from '../common/search';

export async function resolveProfessionalServices(
  tx: DataStore,
  selected: string[],
  previous: string[] = [],
): Promise<string[]> {
  const services = await tx.repo('services').all();
  const prior = new Map(previous.map((name) => [normalizeForSearch(name), name]));
  const resolved = selected.map((name) => {
    const key = normalizeForSearch(name.trim());
    const service = services.find((item) => normalizeForSearch(item.name) === key);
    if (service?.status === 'active') return service.name;
    if (prior.has(key)) return prior.get(key)!;
    throw AppError.validation(`La prestación «${name}» no está disponible.`);
  });
  if (new Set(resolved.map(normalizeForSearch)).size !== resolved.length) {
    throw AppError.validation('No repitas prestaciones.');
  }
  return resolved;
}

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
