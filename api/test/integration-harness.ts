import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function createRequest(app: NestFastifyApplication) {
  return (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: unknown, cookie?: string) =>
    app.getHttpAdapter().getInstance().inject({
      method,
      url: `/api/v1${url}`,
      headers: cookie ? { cookie } : undefined,
      payload,
    });
}

export const sessionCookie = (setCookie: string | string[] | undefined): string =>
  (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0] ?? '';

export interface ScenarioContext {
  request: ReturnType<typeof createRequest>;
  adminCookie: string;
  directorCookie: string;
  patientId: string;
  professionalId: string;
  serviceId: string;
  ruleId: string;
  professionalCookie: string;
  secondPatientId: string;
}
