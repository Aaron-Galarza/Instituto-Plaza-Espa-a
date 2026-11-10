import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { MongoDataStore } from '../dist/database/mongo-data-store.js';

config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI ausente');
  const databaseName = `plaza_smoke_${randomUUID().slice(0, 8)}`;
  const store = new MongoDataStore(uri, databaseName);
  const cleanup = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await store.init();
    const id = randomUUID();
    const now = new Date().toISOString();
    await store.repo('insurers').insert({
      id,
      name: 'Prueba Atlas',
      code: 'SMOKE',
      status: 'active',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    await store.repo('insurers').update(id, { name: 'Actualizado' }, 1);
    const updated = await store.repo('insurers').findById(id);
    if (updated?.name !== 'Actualizado' || updated.version !== 2)
      throw new Error('Actualización no persistida');

    let rejected = false;
    try {
      await store.repo('insurers').update(id, { name: 'Obsoleto' }, 1);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error('No se rechazó una versión obsoleta');

    try {
      await store.transaction(async (tx) => {
        await tx.repo('insurers').update(id, { name: 'No confirmar' }, 2);
        throw new Error('rollback');
      });
    } catch (error) {
      if (error.message !== 'rollback') throw error;
    }
    if ((await store.repo('insurers').findById(id))?.name !== 'Actualizado') {
      throw new Error('Falló el rollback');
    }
    console.log('ATLAS_STORE_OK');
  } finally {
    await store.close();
    if (!/^plaza_smoke_[a-f0-9]{8}$/.test(databaseName))
      throw new Error('Nombre de prueba inválido');
    await cleanup.connect();
    try {
      await cleanup.db(databaseName).dropDatabase();
    } finally {
      await cleanup.close();
    }
  }
}

main().catch((error) => {
  console.error('ATLAS_STORE_FAILED', error.name, error.code || '', error.codeName || '');
  process.exitCode = 1;
});
