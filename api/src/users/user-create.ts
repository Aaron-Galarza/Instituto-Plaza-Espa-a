import { randomUUID } from 'node:crypto';
import { type CreateUserInput, type SessionUser, type User } from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { hashPassword } from '../auth/password';
import type { DataStore } from '../database/data-store';
import type { UserRecord } from '../database/types';
import { toPublicUser, assertProfessionalLinkAvailable } from './user-helpers';

export async function createUser(
  store: DataStore,
  audit: AuditService,
  actor: SessionUser,
  input: CreateUserInput,
): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  return store.transaction(async (tx) => {
    const email = input.email.toLowerCase();
    const duplicate = await tx.repo('users').findOne((user) => user.email === email);
    if (duplicate) throw AppError.conflict('Ya existe un usuario con ese correo.');

    if (input.role !== 'professional' && input.professionalId) {
      throw AppError.validation(
        'Sólo los usuarios con rol Profesional pueden vincularse a un profesional.',
      );
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    let professionalLinked = false;

    if (input.professionalId) {
      await assertProfessionalLinkAvailable(tx, input.professionalId, null);
      professionalLinked = true;
    }

    const user: UserRecord = {
      id,
      name: input.name,
      email,
      role: input.role,
      status: 'active',
      professionalId: input.professionalId ?? null,
      lastLoginAt: null,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await tx.repo('users').insert(user);

    if (professionalLinked && input.professionalId) {
      await tx.repo('professionals').update(input.professionalId, { userId: saved.id });
    }

    await audit.record(
      {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        action: 'user.create',
        entity: 'user',
        entityId: saved.id,
        metadata: { email: saved.email, role: saved.role },
      },
      tx,
    );
    return toPublicUser(saved);
  });
}
