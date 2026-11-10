import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type SessionUser,
  type SetupInput,
  type LoginInput,
} from '@plaza/shared';
import { APP_CONFIG, DATA_STORE } from '../config/tokens';
import type { AppConfig } from '../config/env';
import type { DataStore } from '../database/data-store';
import type { SessionRecord, UserRecord } from '../database/types';
import { AppError } from '../common/errors';
import { AuditService } from '../audit/audit.service';
import { hashPassword, hashToken, verifyPassword } from './password';
import { createSession } from './auth-session-create';
import { LoginRateLimiter } from './login-rate-limiter';
import { AuthPasswordActions } from './auth-password-actions';
import { toSessionUser } from './auth-user';

export interface SessionResult {
  user: SessionUser;
  token: string;
  expiresAt: string;
}

export interface ResolvedSession {
  user: SessionUser;
  session: SessionRecord;
}

export interface CookieSettings {
  name: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
}

@Injectable()
export class AuthService {
  private readonly limiter = new LoginRateLimiter();

  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly audit: AuditService,
  ) {}

  async needsSetup(): Promise<boolean> {
    return (await this.store.repo('users').count()) === 0;
  }

  async setup(input: SetupInput, ip: string): Promise<SessionResult> {
    const passwordHash = await hashPassword(input.password);

    return this.store.transaction(async (tx) => {
      const existing = await tx.repo('users').count();
      if (existing > 0) {
        throw AppError.conflict('La configuración inicial ya fue completada.');
      }
      const email = input.email.toLowerCase();
      const duplicate = await tx.repo('users').findOne((user) => user.email === email);
      if (duplicate) throw AppError.conflict('El correo ya está registrado.');

      const now = new Date().toISOString();
      const admin: UserRecord = {
        id: randomUUID(),
        name: input.name,
        email,
        role: 'admin',
        status: 'active',
        professionalId: null,
        lastLoginAt: now,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await tx.repo('users').insert(admin);
      const session = await createSession(this.config, tx, saved.id, ip);
      const actor = { id: saved.id, name: saved.name, role: saved.role };
      await this.audit.record(
        {
          actor,
          action: 'auth.setup',
          entity: 'user',
          entityId: saved.id,
          metadata: { role: saved.role },
        },
        tx,
      );
      return {
        user: toSessionUser(saved),
        token: session.token,
        expiresAt: session.expiresAt,
      };
    });
  }

  async login(input: LoginInput, ip: string): Promise<SessionResult> {
    const email = input.email.toLowerCase();
    const attemptKey = `${email}|${ip}`;
    this.limiter.assertNotRateLimited(attemptKey);

    const user = await this.store
      .repo('users')
      .findOne((candidate) => candidate.email.toLowerCase() === email);

    const passwordHash = user?.passwordHash ?? (await this.limiter.getDummyHash());
    const valid = await verifyPassword(input.password, passwordHash);

    if (!user || !valid) {
      this.limiter.recordFailure(attemptKey);
      throw AppError.unauthorized('Correo o contraseña incorrectos.');
    }
    if (user.status !== 'active') {
      throw AppError.forbidden('El usuario está inactivo. Contactá a administración.');
    }

    this.limiter.clear(attemptKey);

    const result = await this.store.transaction(async (tx) => {
      const now = new Date().toISOString();
      const updated = await tx.repo('users').update(user.id, { lastLoginAt: now });
      const session = await createSession(this.config, tx, user.id, ip);
      await this.audit.record(
        {
          actor: { id: user.id, name: user.name, role: user.role },
          action: 'auth.login',
          entity: 'user',
          entityId: user.id,
        },
        tx,
      );
      return {
        user: toSessionUser(updated),
        token: session.token,
        expiresAt: session.expiresAt,
      };
    });
    return result;
  }

  async logout(user: SessionUser, token: string): Promise<void> {
    if (!token) return;
    const tokenHash = hashToken(token);
    const session = await this.store
      .repo('sessions')
      .findOne((item) => item.tokenHash === tokenHash);
    if (session) {
      await this.store.repo('sessions').remove(session.id);
      await this.audit.safeRecord({
        actor: { id: user.id, name: user.name, role: user.role },
        action: 'auth.logout',
        entity: 'user',
        entityId: user.id,
      });
    }
  }

  async resolveSession(token: string | undefined): Promise<ResolvedSession | null> {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const session = await this.store
      .repo('sessions')
      .findOne((item) => item.tokenHash === tokenHash);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.store
        .repo('sessions')
        .remove(session.id)
        .catch(() => undefined);
      return null;
    }
    const user = await this.store.repo('users').findById(session.userId);
    if (!user || user.status !== 'active') return null;
    return { user: toSessionUser(user), session };
  }

  private get passwordActions(): AuthPasswordActions {
    return new AuthPasswordActions(this.store, this.audit);
  }
  changePassword(...args: Parameters<AuthPasswordActions['changePassword']>) {
    return this.passwordActions.changePassword(...args);
  }
  resetPassword(...args: Parameters<AuthPasswordActions['resetPassword']>) {
    return this.passwordActions.resetPassword(...args);
  }

  cookieSettings(): CookieSettings {
    return {
      name: this.config.cookie.name,
      path: '/',
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      maxAge: this.config.cookie.ttlHours * 60 * 60,
    };
  }
}
