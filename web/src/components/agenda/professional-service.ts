import type { Professional, Service } from '@plaza/shared';

export function professionalOffersService(
  professional: Professional | undefined,
  service: Service | undefined,
): boolean {
  return Boolean(professional && service && professional.specialties.some((name) =>
    name.trim().localeCompare(service.name.trim(), 'es', { sensitivity: 'base' }) === 0));
}
