import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';

export async function validateGroupReferences(
  store: DataStore,
  input: {
    serviceId: string;
    professionalIds: string[];
    spaceId: string | null;
    capacity: number;
    modality: 'individual' | 'group' | 'shared';
  },
): Promise<void> {
  const service = await store.repo('services').findById(input.serviceId);
  if (!service) throw AppError.validation('La prestación indicada no existe.');
  if (service.status !== 'active') {
    throw AppError.validation('La prestación está inactiva y no puede usarse en un grupo.');
  }
  if (!service.allowedModalities.includes(input.modality)) {
    throw AppError.validation(
      `La prestación "${service.name}" no admite la modalidad seleccionada.`,
    );
  }
  if (input.professionalIds.length === 0) {
    throw AppError.validation('El grupo debe tener al menos un profesional.');
  }
  for (const professionalId of input.professionalIds) {
    const professional = await store.repo('professionals').findById(professionalId);
    if (!professional) throw AppError.validation('Uno de los profesionales no existe.');
    if (professional.status !== 'active') {
      throw AppError.validation(
        `El profesional ${professional.firstName} ${professional.lastName} está inactivo.`,
      );
    }
  }
  if (input.spaceId) {
    const space = await store.repo('spaces').findById(input.spaceId);
    if (!space) throw AppError.validation('El espacio indicado no existe.');
    if (space.status !== 'active') {
      throw AppError.validation(`El espacio "${space.name}" está inactivo.`);
    }
    if (input.capacity > space.capacity) {
      throw AppError.validation(
        `La capacidad del grupo (${input.capacity}) supera la del espacio "${space.name}" (${space.capacity}).`,
      );
    }
  }
}
