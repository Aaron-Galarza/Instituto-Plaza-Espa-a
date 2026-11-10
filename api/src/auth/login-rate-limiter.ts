import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { AppError } from '../common/errors';
import { hashPassword } from './password';

interface LoginAttempt {
  count: number;
  resetAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export class LoginRateLimiter {
  private readonly logger = new Logger('Auth');
  private readonly failures = new Map<string, LoginAttempt>();
  private dummyHash: Promise<string> | null = null;
  clear(key: string): void {
    this.failures.delete(key);
  }
  getDummyHash(): Promise<string> {
    if (!this.dummyHash) {
      this.dummyHash = hashPassword(`dummy-${randomUUID()}`);
    }
    return this.dummyHash;
  }

  assertNotRateLimited(key: string): void {
    const attempt = this.failures.get(key);
    if (!attempt) return;
    if (attempt.resetAt <= Date.now()) {
      this.failures.delete(key);
      return;
    }
    if (attempt.count >= MAX_FAILED_ATTEMPTS) {
      throw AppError.rateLimited(
        'Demasiados intentos fallidos. Esperá 15 minutos antes de volver a intentar.',
      );
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const attempt = this.failures.get(key);
    if (!attempt || attempt.resetAt <= now) {
      this.failures.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    } else {
      attempt.count += 1;
    }
    if (this.failures.size > 5000) {
      for (const [mapKey, value] of this.failures) {
        if (value.resetAt <= now) this.failures.delete(mapKey);
      }
    }
    this.logger.warn(`Intento de acceso fallido (${key.split('|')[0]}).`);
  }
}
