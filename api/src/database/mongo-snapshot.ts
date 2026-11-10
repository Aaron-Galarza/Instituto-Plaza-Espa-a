import type { AnyBulkWriteOperation, ClientSession, Db, Document } from 'mongodb';
import { COLLECTION_NAMES, emptyDatabase, type DatabaseSchema } from './types';

interface StoredDocument extends Document {
  _id: string;
  id: string;
}
type RecordDocument = Omit<StoredDocument, '_id'>;

export async function loadMongoSnapshot(db: Db, session?: ClientSession): Promise<DatabaseSchema> {
  const snapshot = emptyDatabase();
  for (const name of COLLECTION_NAMES) {
    const documents = await db.collection<StoredDocument>(name).find({}, { session }).toArray();
    (snapshot as unknown as Record<string, RecordDocument[]>)[name] = documents.map(
      ({ _id: _ignored, ...document }) => document,
    );
  }
  return snapshot;
}

export async function saveMongoChanges(
  db: Db,
  before: DatabaseSchema,
  after: DatabaseSchema,
  session: ClientSession,
): Promise<void> {
  for (const name of COLLECTION_NAMES) {
    const collection = db.collection<StoredDocument>(name);
    const previous = new Map(
      (before[name] as RecordDocument[]).map((document) => [document.id, document]),
    );
    const current = new Map(
      (after[name] as RecordDocument[]).map((document) => [document.id, document]),
    );
    const writes: AnyBulkWriteOperation<StoredDocument>[] = [];
    for (const [id, document] of current) {
      if (JSON.stringify(previous.get(id)) === JSON.stringify(document)) continue;
      writes.push({
        replaceOne: { filter: { _id: id }, replacement: { ...document, _id: id }, upsert: true },
      });
    }
    for (const id of previous.keys()) {
      if (!current.has(id)) writes.push({ deleteOne: { filter: { _id: id } } });
    }
    if (writes.length) await collection.bulkWrite(writes, { session, ordered: true });
  }
}
