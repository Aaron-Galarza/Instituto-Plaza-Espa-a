import type { CollectionName, DocumentOf } from './types';

/**
 * Puerto de persistencia. Los servicios de negocio sólo dependen de esta
 * interfaz, nunca del archivo JSON. Un adaptador Mongoose puede implementar
 * las mismas operaciones sin cambiar los servicios.
 */
export interface Repository<T extends { id: string }> {
  all(): Promise<T[]>;
  where(predicate: (document: T) => boolean): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(predicate: (document: T) => boolean): Promise<T | null>;
  insert(document: T): Promise<T>;
  update(id: string, patch: Partial<T>, expectedVersion?: number): Promise<T>;
  remove(id: string): Promise<boolean>;
  count(predicate?: (document: T) => boolean): Promise<number>;
}

export interface DataStore {
  init(): Promise<void>;
  repo<K extends CollectionName>(collection: K): Repository<DocumentOf<K>>;
  transaction<T>(fn: (tx: DataStore) => Promise<T>): Promise<T>;
}

export interface VersionedDocument {
  id: string;
  version?: number;
  updatedAt?: string;
}
