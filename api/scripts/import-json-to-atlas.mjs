import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { config } from 'dotenv';
import { JsonDataStore } from '../dist/database/json-data-store.js';
import { MongoDataStore } from '../dist/database/mongo-data-store.js';
import { COLLECTION_NAMES } from '../dist/database/types.js';

const projectRoot = path.resolve(__dirname, '../..');
config({ path: path.join(projectRoot, 'api/.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI ausente');
  const databaseName = process.env.MONGODB_DB || 'plaza_espana';
  const jsonPath = path.resolve(projectRoot, 'api/data/data.json');
  const source = await JsonDataStore.create(jsonPath);
  const destination = new MongoDataStore(uri, databaseName);
  try {
    await destination.init();
    const counts = await Promise.all(
      COLLECTION_NAMES.map((name) => destination.repo(name).count()),
    );
    if (counts.some((count) => count > 0)) {
      throw new Error('Atlas contiene datos; importación cancelada para evitar sobrescrituras');
    }
    await destination.transaction(async (tx) => {
      for (const name of COLLECTION_NAMES) {
        const documents = await source.repo(name).all();
        for (const document of documents) await tx.repo(name).insert(document);
      }
    });
    const expected = await Promise.all(COLLECTION_NAMES.map((name) => source.repo(name).count()));
    const actual = await Promise.all(
      COLLECTION_NAMES.map((name) => destination.repo(name).count()),
    );
    if (expected.some((count, index) => count !== actual[index])) {
      throw new Error(
        'Importación finalizada con recuentos distintos; revisar antes de cambiar backend',
      );
    }
    console.log(
      'ATLAS_IMPORT_OK',
      Object.fromEntries(COLLECTION_NAMES.map((name, i) => [name, actual[i]])),
    );
  } finally {
    await destination.close();
  }
}

main().catch((error) => {
  let message = String(error.message || '');
  for (const secret of [
    process.env.MONGODB_URI,
    process.env.MONGODB_USERNAME,
    process.env.MONGODB_PASSWORD,
  ]) {
    if (secret) message = message.replaceAll(secret, '[redacted]');
  }
  console.error('ATLAS_IMPORT_FAILED', error.name, error.code || '', message);
  process.exitCode = 1;
});
