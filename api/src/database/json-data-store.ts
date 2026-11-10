import { randomUUID } from 'node:crypto';
import { AppError } from '../common/errors';
import type { DataStore, Repository } from './data-store';
import { StoreRepository } from './store-repository';
import { persistJsonDatabase } from './persist-json-database';
import { loadJsonDatabase } from './load-json-database';
import { emptyDatabase, type CollectionName, type DatabaseSchema, type DocumentOf } from './types';

/**
 * Adaptador JSON con escrituras serializadas y reemplazo atómico del archivo.
 * Toda transacción opera sobre un clon aislado y recién persiste si la función
 * finaliza correctamente.
 */
export class JsonDataStore implements DataStore {
  private data: DatabaseSchema = emptyDatabase();
  private queue: Promise<unknown> = Promise.resolve();
  private initialized = false;
  private readonly transactionView: boolean;

  constructor(
    private readonly filePath: string,
    data?: DatabaseSchema,
  ) {
    this.transactionView = data !== undefined;
    if (data) {
      this.data = data;
      this.initialized = true;
    }
  }

  static async create(filePath: string): Promise<JsonDataStore> {
    const store = new JsonDataStore(filePath);
    await store.init();
    return store;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.data = await loadJsonDatabase(this.filePath);
    this.initialized = true;
  }

  repo<K extends CollectionName>(collection: K): Repository<DocumentOf<K>> {
    return new StoreRepository<DocumentOf<K>>(this, collection) as Repository<DocumentOf<K>>;
  }

  async transaction<T>(fn: (tx: DataStore) => Promise<T>): Promise<T> {
    if (this.transactionView) {
      return fn(this);
    }
    return this.enqueue(async () => {
      const draft = structuredClone(this.data);
      const view = new JsonDataStore(this.filePath, draft);
      const result = await fn(view);
      await persistJsonDatabase(this.filePath, draft);
      this.data = draft;
      return result;
    });
  }

  // -------------------------------------------------------------------------
  // Operaciones requeridas por StoreRepository
  // -------------------------------------------------------------------------

  async readCollection<T>(collection: CollectionName): Promise<T[]> {
    return this.enqueue(() => structuredClone(this.data[collection]) as T[]);
  }

  async findDocuments<T>(
    collection: CollectionName,
    predicate: (document: T) => boolean,
  ): Promise<T[]> {
    return this.enqueue(() => {
      const docs = this.data[collection] as T[];
      return structuredClone(docs.filter((doc) => predicate(doc)));
    });
  }

  async findDocument<T>(collection: CollectionName, id: string): Promise<T | null> {
    return this.enqueue(() => {
      const doc = (this.data[collection] as Array<{ id: string }>).find((item) => item.id === id);
      return doc ? (structuredClone(doc) as T) : null;
    });
  }

  async findOneDocument<T>(
    collection: CollectionName,
    predicate: (document: T) => boolean,
  ): Promise<T | null> {
    return this.enqueue(() => {
      const doc = (this.data[collection] as T[]).find((item) => predicate(item));
      return doc ? structuredClone(doc) : null;
    });
  }

  async insertDocument<T extends { id: string }>(
    collection: CollectionName,
    document: T,
  ): Promise<T> {
    if (!this.transactionView) {
      return this.transaction((tx) => (tx as JsonDataStore).insertDocument(collection, document));
    }
    return this.enqueue(() => {
      const docs = this.data[collection] as unknown as Array<T>;
      if (docs.some((doc) => doc.id === document.id)) {
        throw AppError.conflict('Ya existe un registro con el mismo identificador.');
      }
      const now = new Date().toISOString();
      const record = {
        ...document,
        id: document.id || randomUUID(),
        createdAt: (document as { createdAt?: string }).createdAt ?? now,
        updatedAt: (document as { updatedAt?: string }).updatedAt ?? now,
      } as T;
      docs.push(record);
      return structuredClone(record);
    });
  }

  async updateDocument<T extends { id: string }>(
    collection: CollectionName,
    id: string,
    patch: Partial<T>,
    expectedVersion?: number,
  ): Promise<T> {
    if (!this.transactionView) {
      return this.transaction((tx) =>
        (tx as JsonDataStore).updateDocument<T>(collection, id, patch, expectedVersion),
      );
    }
    return this.enqueue(() => {
      const docs = this.data[collection] as unknown as Array<T>;
      const index = docs.findIndex((doc) => doc.id === id);
      if (index < 0) throw AppError.notFound('Registro');
      const current = docs[index] as T & { version?: number };
      if (
        expectedVersion !== undefined &&
        typeof current.version === 'number' &&
        current.version !== expectedVersion
      ) {
        throw AppError.staleWrite();
      }
      const now = new Date().toISOString();
      const next = {
        ...current,
        ...patch,
        updatedAt: now,
      } as T & { version?: number };
      if (
        typeof current.version === 'number' &&
        (patch as { version?: number }).version === undefined
      ) {
        next.version = current.version + 1;
      }
      docs[index] = next as T;
      return structuredClone(next as T);
    });
  }

  async removeDocument(collection: CollectionName, id: string): Promise<boolean> {
    if (!this.transactionView) {
      return this.transaction((tx) => (tx as JsonDataStore).removeDocument(collection, id));
    }
    return this.enqueue(() => {
      const docs = this.data[collection] as Array<{ id: string }>;
      const index = docs.findIndex((doc) => doc.id === id);
      if (index < 0) return false;
      docs.splice(index, 1);
      return true;
    });
  }

  async countDocuments<T>(
    collection: CollectionName,
    predicate?: (document: T) => boolean,
  ): Promise<number> {
    return this.enqueue(() => {
      const docs = this.data[collection] as T[];
      return predicate ? docs.filter((doc) => predicate(doc)).length : docs.length;
    });
  }

  // -------------------------------------------------------------------------

  private enqueue<T>(task: () => T | Promise<T>): Promise<T> {
    if (this.transactionView) {
      return Promise.resolve().then(task);
    }
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
