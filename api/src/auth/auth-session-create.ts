import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../config/env';
import type { DataStore } from '../database/data-store';
import type { SessionRecord } from '../database/types';
import { generateSessionToken, hashToken } from './password';

export async function createSession(
  config: AppConfig,
  tx: DataStore,
  userId: string,
  ip: string,
): Promise<{ token: string; expiresAt: string }> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.cookie.ttlHours * 60 * 60 * 1000);
  const session: SessionRecord = {
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastLoginIp: ip || null,
  };
  await tx.repo('sessions').insert(session);
  // Limpieza oportunista de sesiones expiradas del usuario.
  const stale = await tx
    .repo('sessions')
    .where(
      (item) =>
        item.userId === userId &&
        item.id !== session.id &&
        new Date(item.expiresAt).getTime() <= Date.now(),
    );
  for (const item of stale) await tx.repo('sessions').remove(item.id);
  return { token, expiresAt: session.expiresAt };
}
