import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { COLLECTION_NAMES, emptyDatabase, type DatabaseSchema } from './types';
import { persistJsonDatabase } from './persist-json-database';

export async function loadJsonDatabase(filePath: string): Promise<DatabaseSchema> {
  await mkdir(path.dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    const data = emptyDatabase();
    await persistJsonDatabase(filePath, data);
    return data;
  }

  const raw = await readFile(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `El archivo de datos ${filePath} no es JSON válido. Se aborta para no perder información.`,
    );
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`El archivo de datos ${filePath} debe contener un objeto.`);
  }

  const record = parsed as Record<string, unknown>;
  let changed = false;
  for (const name of COLLECTION_NAMES) {
    if (record[name] === undefined) {
      record[name] = [];
      changed = true;
    } else if (!Array.isArray(record[name])) {
      throw new Error(`La colección "${name}" del archivo de datos debe ser un arreglo.`);
    }
  }

  const data = record as unknown as DatabaseSchema;
  if (changed) await persistJsonDatabase(filePath, data);
  return data;
}
