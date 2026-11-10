import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../src/app.module';
import { AppExceptionFilter } from '../src/common/exception.filter';

import { createRequest, sessionCookie, type ScenarioContext } from './integration-harness';
import { setupSchedule } from './integration-schedule-setup';
import { checkRequestsAndAbsence } from './integration-requests-absence';
import { checkRequestAdjustment } from './integration-request-adjustment';
import { checkSeriesSplit } from './integration-series-split';
import { checkGroupChanges } from './integration-groups';
import { checkRollingConflicts } from './integration-rolling-conflicts';

let directory: string;
let app: NestFastifyApplication;
let adminCookie: string;
let directorCookie: string;
let patientId: string;

let request: ReturnType<typeof createRequest>;

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T12:00:00.000Z'));
  directory = await mkdtemp(path.join(tmpdir(), 'plaza-api-test-'));
  process.env.DATA_FILE = path.join(directory, 'data.json');
  process.env.DATA_BACKEND = 'json';
  process.env.NODE_ENV = 'test';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.register(fastifyCookie as never);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AppExceptionFilter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  request = createRequest(app);
});

afterAll(async () => {
  vi.useRealTimers();
  await app?.close();
  delete process.env.DATA_FILE;
  delete process.env.DATA_BACKEND;
  await rm(directory, { recursive: true, force: true });
});

describe('API integrada con archivo de prueba aislado', () => {
  it('inicializa un solo administrador y exige sesión para los catálogos', async () => {
    const unauthenticated = await request('GET', '/patients');
    expect(unauthenticated.statusCode).toBe(401);

    const setup = await request('POST', '/auth/setup', {
      name: 'Administración',
      email: 'admin@test.local',
      password: 'ClaveSegura123',
    });
    expect(setup.statusCode).toBe(201);
    adminCookie = sessionCookie(setup.headers['set-cookie']);
    expect(adminCookie).toContain('plaza_session=');
    expect(
      (
        await request('POST', '/auth/setup', {
          name: 'Otro',
          email: 'otro@test.local',
          password: 'ClaveSegura123',
        })
      ).statusCode,
    ).not.toBe(201);
  });

  it('aplica permisos de dirección y persiste operaciones de catálogo', async () => {
    const patient = await request(
      'POST',
      '/patients',
      {
        firstName: 'Paciente',
        lastName: 'Prueba',
        transportMode: 'own',
      },
      adminCookie,
    );
    expect(patient.statusCode).toBe(201);
    const record = patient.json();
    patientId = record.id;
    expect(record.firstName).toBe('Paciente');
    const listing = await request('GET', '/patients?page=1&pageSize=10', undefined, adminCookie);
    expect(listing.statusCode).toBe(200);
    expect(listing.json().items.map((item: { id: string }) => item.id)).toContain(record.id);

    const forbidden = await request(
      'GET',
      '/dashboard?from=2026-10-26&to=2026-10-26',
      undefined,
      adminCookie,
    );
    expect(forbidden.statusCode).toBe(403);
    const director = await request(
      'POST',
      '/users',
      {
        name: 'Dirección',
        email: 'director@test.local',
        password: 'ClaveSegura123',
        role: 'director',
      },
      adminCookie,
    );
    expect(director.statusCode).toBe(201);
    const login = await request('POST', '/auth/login', {
      email: 'director@test.local',
      password: 'ClaveSegura123',
    });
    expect(login.statusCode).toBe(200);
    directorCookie = sessionCookie(login.headers['set-cookie']);
    const dashboard = await request(
      'GET',
      '/dashboard?from=2026-10-26&to=2026-10-26',
      undefined,
      directorCookie,
    );
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.json().metrics.uniquePatients).toBe(0);
  });

  it('programa recurrencias, aplica permisos y resuelve cambios y ausencias', async () => {
    const ctx: ScenarioContext = {
      request, adminCookie, directorCookie, patientId,
      professionalId: '', serviceId: '', ruleId: '', professionalCookie: '', secondPatientId: '',
    };
    await setupSchedule(ctx);
    await checkRequestsAndAbsence(ctx);
    await checkRequestAdjustment(ctx);
    await checkSeriesSplit(ctx);
    await checkGroupChanges(ctx);
    await checkRollingConflicts(ctx);
  });
});
