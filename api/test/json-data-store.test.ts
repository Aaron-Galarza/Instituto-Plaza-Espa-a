import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JsonDataStore } from '../src/database/json-data-store';

let directory: string;
let filename: string;
let store: JsonDataStore;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'plaza-store-test-'));
  filename = path.join(directory, 'data.json');
  store = await JsonDataStore.create(filename);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('JsonDataStore', () => {
  it('persiste datos al reabrir el archivo y conserva las colecciones vacías', async () => {
    await store.repo('sessions').insert({
      id: 'session-1',
      userId: 'user-1',
      tokenHash: 'hash',
      createdAt: '2026-10-01T12:00:00.000Z',
      expiresAt: '2026-11-01T12:00:00.000Z',
    });
    const reopened = await JsonDataStore.create(filename);
    expect((await reopened.repo('sessions').all()).map((item) => item.id)).toEqual(['session-1']);
    expect(JSON.parse(await readFile(filename, 'utf8')).patients).toEqual([]);
  });

  it('serializa escrituras concurrentes y no pierde registros', async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        store.repo('sessions').insert({
          id: `session-${index}`,
          userId: 'user-1',
          tokenHash: `hash-${index}`,
          createdAt: '2026-10-01T12:00:00.000Z',
          expiresAt: '2026-11-01T12:00:00.000Z',
        }),
      ),
    );
    const reopened = await JsonDataStore.create(filename);
    expect(await reopened.repo('sessions').count()).toBe(25);
  });

  it('revierte una transacción fallida y rechaza una versión obsoleta', async () => {
    await expect(
      store.transaction(async (tx) => {
        await tx.repo('sessions').insert({
          id: 'transient',
          userId: 'user-1',
          tokenHash: 'hash',
          createdAt: '2026-10-01T12:00:00.000Z',
          expiresAt: '2026-11-01T12:00:00.000Z',
        });
        throw new Error('abort');
      }),
    ).rejects.toThrow('abort');
    expect(await store.repo('sessions').count()).toBe(0);

    await store.repo('scheduleRules').insert({
      id: 'rule-1',
      seriesId: 'series-1',
      version: 1,
      patientId: 'patient-1',
      daysOfWeek: [1],
      effectiveFrom: '2026-10-26',
      startMinute: 540,
      endMinute: 600,
      segments: [],
      status: 'active',
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    });
    await store.repo('scheduleRules').update('rule-1', { startMinute: 550 }, 1);
    await expect(
      store.repo('scheduleRules').update('rule-1', { startMinute: 560 }, 1),
    ).rejects.toThrow();
    expect((await store.repo('scheduleRules').findById('rule-1'))?.startMinute).toBe(550);
  });
});
