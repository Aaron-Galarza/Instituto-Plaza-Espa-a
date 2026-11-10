import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { DatabaseSchema } from './types';

const RENAME_RETRIES = 6;
const RENAME_DELAY_MS = 40;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function persistJsonDatabase(filePath: string, data: DatabaseSchema): Promise<void> {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });
  const tempFile = `${filePath}.tmp-${process.pid}-${randomUUID().slice(0, 8)}`;
  const json = `${JSON.stringify(data, null, 2)}\n`;

  const handle = await open(tempFile, 'w');
  try {
    await handle.writeFile(json, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }

  try {
    for (let attempt = 0; attempt <= RENAME_RETRIES; attempt += 1) {
      try {
        await rename(tempFile, filePath);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (
          (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') &&
          attempt < RENAME_RETRIES
        ) {
          await sleep(RENAME_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    await unlink(tempFile).catch(() => undefined);
    throw error;
  }
}
