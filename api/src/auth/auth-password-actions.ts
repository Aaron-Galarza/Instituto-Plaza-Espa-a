import { type ChangePasswordInput, type SessionUser } from '@plaza/shared';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import type { DataStore } from '../database/data-store';
import { hashPassword, verifyPassword } from './password';

export class AuthPasswordActions {
  constructor(
    private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}
  async changePassword(user: SessionUser, input: ChangePasswordInput): Promise<void> {
    const stored = await this.store.repo('users').findById(user.id);
    if (!stored) throw AppError.notFound('Usuario');
    const valid = await verifyPassword(input.currentPassword, stored.passwordHash);
    if (!valid) throw AppError.validation('La contraseña actual no es correcta.');
    if (input.currentPassword === input.newPassword) {
      throw AppError.validation('La nueva contraseña debe ser diferente de la actual.');
    }
    const passwordHash = await hashPassword(input.newPassword);

    await this.store.transaction(async (tx) => {
      await tx.repo('users').update(user.id, { passwordHash });
      const sessions = await tx.repo('sessions').where((session) => session.userId === user.id);
      for (const session of sessions) {
        await tx.repo('sessions').remove(session.id);
      }
      await this.audit.record(
        {
          actor: { id: user.id, name: user.name, role: user.role },
          action: 'auth.password',
          entity: 'user',
          entityId: user.id,
        },
        tx,
      );
    });
  }

  async resetPassword(actor: SessionUser, userId: string, newPassword: string): Promise<void> {
    const target = await this.store.repo('users').findById(userId);
    if (!target) throw AppError.notFound('Usuario');
    const passwordHash = await hashPassword(newPassword);

    await this.store.transaction(async (tx) => {
      await tx.repo('users').update(userId, { passwordHash });
      const sessions = await tx.repo('sessions').where((session) => session.userId === userId);
      for (const session of sessions) {
        await tx.repo('sessions').remove(session.id);
      }
      await this.audit.record(
        {
          actor: { id: actor.id, name: actor.name, role: actor.role },
          action: 'user.reset_password',
          entity: 'user',
          entityId: userId,
          metadata: { email: target.email },
        },
        tx,
      );
    });
  }
}
