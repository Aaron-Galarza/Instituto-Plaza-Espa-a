import type { Repository } from './data-store';
import type { CollectionName } from './types';
import type { JsonDataStore } from './json-data-store';

export class StoreRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly store: JsonDataStore,
    private readonly collection: CollectionName,
  ) {}

  all(): Promise<T[]> {
    return this.store.readCollection<T>(this.collection);
  }
  where(predicate: (document: T) => boolean): Promise<T[]> {
    return this.store.findDocuments<T>(this.collection, predicate);
  }
  findById(id: string): Promise<T | null> {
    return this.store.findDocument<T>(this.collection, id);
  }
  findOne(predicate: (document: T) => boolean): Promise<T | null> {
    return this.store.findOneDocument<T>(this.collection, predicate);
  }
  insert(document: T): Promise<T> {
    return this.store.insertDocument<T>(this.collection, document);
  }
  update(id: string, patch: Partial<T>, expectedVersion?: number): Promise<T> {
    return this.store.updateDocument<T>(this.collection, id, patch, expectedVersion);
  }
  remove(id: string): Promise<boolean> {
    return this.store.removeDocument(this.collection, id);
  }
  count(predicate?: (document: T) => boolean): Promise<number> {
    return this.store.countDocuments(this.collection, predicate);
  }
}
