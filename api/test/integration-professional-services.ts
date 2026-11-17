import { expect } from 'vitest';
import { createRequest } from './integration-harness';

export async function checkProfessionalServices(
  request: ReturnType<typeof createRequest>,
  adminCookie: string,
): Promise<void> {
  const professionalInput = {
    firstName: 'María',
    lastName: 'Ejemplo',
    color: '#1F5297',
    specialties: ['Terapia de prueba'],
  };

  const missing = await request('POST', '/professionals', professionalInput, adminCookie);
  expect(missing.statusCode).toBe(422);

  const service = await request('POST', '/services', {
    name: 'Terapia de prueba',
    allowedModalities: ['individual'],
  }, adminCookie);
  expect(service.statusCode).toBe(201);
  const serviceId = service.json().id as string;

  const professional = await request('POST', '/professionals', professionalInput, adminCookie);
  expect(professional.statusCode).toBe(201);
  const professionalId = professional.json().id as string;
  expect(professional.json().specialties).toEqual(['Terapia de prueba']);

  const renamed = await request('PATCH', `/services/${serviceId}`, {
    name: 'Terapia renombrada',
  }, adminCookie);
  expect(renamed.statusCode).toBe(200);
  const linked = await request('GET', `/professionals/${professionalId}`, undefined, adminCookie);
  expect(linked.json().specialties).toEqual(['Terapia renombrada']);

  const removal = await request('DELETE', `/services/${serviceId}`, undefined, adminCookie);
  expect(removal.statusCode).toBe(409);

  const inactive = await request('POST', `/services/${serviceId}/status`, {
    status: 'inactive',
  }, adminCookie);
  expect(inactive.statusCode).toBe(201);
  const unavailable = await request('POST', '/professionals', {
    ...professionalInput,
    firstName: 'Otra',
    specialties: ['Terapia renombrada'],
  }, adminCookie);
  expect(unavailable.statusCode).toBe(422);

  const preserved = await request('PATCH', `/professionals/${professionalId}`, {
    firstName: 'Mariana',
    specialties: ['Terapia renombrada'],
  }, adminCookie);
  expect(preserved.statusCode).toBe(200);
  expect(preserved.json().specialties).toEqual(['Terapia renombrada']);
}
