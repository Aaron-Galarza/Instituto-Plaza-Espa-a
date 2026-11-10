import { MongoClient, type Db } from 'mongodb';
import { AppError } from '../common/errors';
import type { DataStore, Repository } from './data-store';
import { JsonDataStore } from './json-data-store';
import { loadMongoSnapshot, saveMongoChanges } from './mongo-snapshot';
import type { CollectionName, DocumentOf } from './types';

interface RevisionRecord {
  _id: string;
  revision: number;
}

export class MongoDataStore implements DataStore {
  private readonly client: MongoClient;
  private readonly db: Db;

  constructor(uri: string, databaseName: string) {
    this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    this.db = this.client.db(databaseName);
  }

  async init(): Promise<void> {
    await this.client.connect();
    await this.db.command({ ping: 1 });
    await this.db
      .collection<RevisionRecord>('_storeRevision')
      .updateOne({ _id: 'state' }, { $setOnInsert: { revision: 0 } }, { upsert: true });
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  repo<K extends CollectionName>(collection: K): Repository<DocumentOf<K>> {
    return new MongoRepository<DocumentOf<K>>(this, collection);
  }

  async read<T>(collection: CollectionName, predicate: (value: T) => boolean): Promise<T[]> {
    const documents = await this.db.collection(collection).find().toArray();
    const values = documents.map(({ _id: _ignored, ...document }) => document as T);
    return structuredClone(values.filter(predicate));
  }

  async transaction<T>(fn: (tx: DataStore) => Promise<T>): Promise<T> {
    const session = this.client.startSession();
    try {
      const result = await session.withTransaction(
        async () => {
          const revisions = this.db.collection<RevisionRecord>('_storeRevision');
          const revision = await revisions.findOne({ _id: 'state' }, { session });
          if (!revision) throw new Error('Falta la revisión de la base MongoDB');
          const before = await loadMongoSnapshot(this.db, session);
          const draft = structuredClone(before);
          const view = new JsonDataStore('', draft);
          const value = await fn(view);
          const updated = await revisions.updateOne(
            { _id: 'state', revision: revision.revision },
            { $inc: { revision: 1 } },
            { session },
          );
          if (updated.matchedCount !== 1) throw AppError.staleWrite();
          await saveMongoChanges(this.db, before, draft, session);
          return value;
        },
        { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } },
      );
      return result as T;
    } finally {
      await session.endSession();
    }
  }
}

class MongoRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly store: MongoDataStore,
    private readonly collection: CollectionName,
  ) {}

  all(): Promise<T[]> {
    return this.store.read<T>(this.collection, () => true);
  }
  where(predicate: (document: T) => boolean): Promise<T[]> {
    return this.store.read(this.collection, predicate);
  }
  async findById(id: string): Promise<T | null> {
    return (await this.where((document) => document.id === id))[0] ?? null;
  }
  async findOne(predicate: (document: T) => boolean): Promise<T | null> {
    return (await this.where(predicate))[0] ?? null;
  }
  async insert(document: T): Promise<T> {
    return this.store.transaction((tx) =>
      (tx.repo(this.collection) as unknown as Repository<T>).insert(document),
    );
  }
  async update(id: string, patch: Partial<T>, expectedVersion?: number): Promise<T> {
    return this.store.transaction((tx) =>
      (tx.repo(this.collection) as unknown as Repository<T>).update(id, patch, expectedVersion),
    );
  }
  remove(id: string): Promise<boolean> {
    return this.store.transaction((tx) => tx.repo(this.collection).remove(id));
  }
  async count(predicate?: (document: T) => boolean): Promise<number> {
    return (await this.where(predicate ?? (() => true))).length;
  }
}
