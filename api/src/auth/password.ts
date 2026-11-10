import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived as Buffer);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? '', 'hex');
  const expected = Buffer.from(parts[5] ?? '', 'hex');
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || salt.length === 0)
    return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, expected.length, { N: n, r, p }, (error, value) => {
      if (error) reject(error);
      else resolve(value as Buffer);
    });
  });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
