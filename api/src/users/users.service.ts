import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateUserInput,
  type ResetPasswordInput,
  type SessionUser,
  type UpdateUserInput,
  type User,
  type UserStatusUpdate,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import type { UserRecord } from '../database/types';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { toPublicUser, assertProfessionalLinkAvailable } from './user-helpers';
import { UserQueries } from './user-queries';
import { createUser } from './user-create';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  private get queries(): UserQueries {
    return new UserQueries(this.store);
  }
  list(...args: Parameters<UserQueries['list']>) {
    return this.queries.list(...args);
  }
  get(...args: Parameters<UserQueries['get']>) {
    return this.queries.get(...args);
  }

  create(actor: SessionUser, input: CreateUserInput): Promise<User> {
    return createUser(this.store, this.audit, actor, input);
  }

  async update(actor: SessionUser, id: string, input: UpdateUserInput): Promise<User> {
    return this.store.transaction(async (tx) => {
      const current = await tx.repo('users').findById(id);
      if (!current) throw AppError.notFound('Usuario');

      if (actor.id === id && input.role && input.role !== current.role) {
        throw AppError.forbidden('No podés cambiar tu propio rol.');
      }
      if (actor.id === id && input.status === 'inactive') {
        throw AppError.forbidden('No podés desactivar tu propio usuario.');
      }

      if (input.email) {
        const email = input.email.toLowerCase();
        const duplicate = await tx
          .repo('users')
          .findOne((user) => user.id !== id && user.email === email);
        if (duplicate) throw AppError.conflict('Ya existe un usuario con ese correo.');
        input = { ...input, email };
      }

      const nextRole = input.role ?? current.role;
      const nextProfessionalId =
        input.professionalId !== undefined
          ? input.professionalId
          : (current.professionalId ?? null);

      if (nextRole !== 'professional' && nextProfessionalId) {
        throw AppError.validation(
          'Un usuario que no es Profesional no puede tener un profesional vinculado. Quitá el vínculo primero.',
        );
      }

      if (current.role === 'admin' || current.role === 'director') {
        const losesAdmin =
          (nextRole !== 'admin' && nextRole !== 'director') || input.status === 'inactive';
        if (losesAdmin) {
          const others = await tx
            .repo('users')
            .where(
              (user) =>
                user.id !== id &&
                user.status === 'active' &&
                (user.role === 'admin' || user.role === 'director'),
            );
          if (others.length === 0) {
            throw AppError.conflict(
              'Debe quedar al menos un usuario activo con permisos de administración.',
            );
          }
        }
      }

      let professionalIdChanged = false;
      if (input.professionalId !== undefined && input.professionalId !== current.professionalId) {
        if (nextProfessionalId) {
          await assertProfessionalLinkAvailable(tx, nextProfessionalId, id);
        }
        if (current.professionalId) {
          const oldProfessional = await tx.repo('professionals').findById(current.professionalId);
          if (oldProfessional && oldProfessional.userId === id) {
            await tx.repo('professionals').update(oldProfessional.id, { userId: null });
          }
        }
        if (nextProfessionalId) {
          await tx.repo('professionals').update(nextProfessionalId, { userId: id });
        }
        professionalIdChanged = true;
      }

      const patch: Partial<UserRecord> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(professionalIdChanged ? { professionalId: nextProfessionalId } : {}),
      };

      const updated = await tx.repo('users').update(id, patch);

      if (input.status === 'inactive' || input.role !== undefined) {
        const sessions = await tx.repo('sessions').where((session) => session.userId === id);
        for (const session of sessions) await tx.repo('sessions').remove(session.id);
      }

      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'user.update',
          entity: 'user',
          entityId: id,
          metadata: {
            fields: Object.keys(input),
            ...(input.role ? { role: input.role } : {}),
          },
        },
        tx,
      );
      return toPublicUser(updated);
    });
  }

  async setStatus(actor: SessionUser, id: string, input: UserStatusUpdate): Promise<User> {
    return this.update(actor, id, { status: input.status });
  }

  async resetPassword(
    actor: SessionUser,
    id: string,
    input: ResetPasswordInput,
  ): Promise<{ ok: true }> {
    await this.auth.resetPassword(actor, id, input.password);
    return { ok: true };
  }
}
