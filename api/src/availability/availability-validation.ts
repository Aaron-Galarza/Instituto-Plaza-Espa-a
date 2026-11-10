import { intervalsOverlap, type ProfessionalAvailability } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';

const FAR_FUTURE = '9999-12-31';
export async function validateEntry(
  tx: DataStore,
  entry: ProfessionalAvailability,
  excludeId: string | null,
): Promise<void> {
  if (entry.startMinute >= entry.endMinute) {
    throw AppError.validation('La hora de inicio debe ser anterior a la de fin.');
  }
  if (entry.effectiveTo && entry.effectiveTo < entry.effectiveFrom) {
    throw AppError.validation('La vigencia hasta no puede ser anterior al inicio.');
  }
  if (entry.kind === 'regular' && entry.dayOfWeek === null) {
    throw AppError.validation('La disponibilidad habitual requiere un día de la semana.');
  }
  if (entry.kind === 'regular' && entry.status === 'active') {
    const others = await tx
      .repo('professionalAvailability')
      .where(
        (other) =>
          other.id !== excludeId &&
          other.professionalId === entry.professionalId &&
          other.kind === 'regular' &&
          other.status === 'active' &&
          other.dayOfWeek === entry.dayOfWeek &&
          intervalsOverlap(
            other.startMinute,
            other.endMinute,
            entry.startMinute,
            entry.endMinute,
          ) &&
          other.effectiveFrom <= (entry.effectiveTo ?? FAR_FUTURE) &&
          entry.effectiveFrom <= (other.effectiveTo ?? FAR_FUTURE),
      );
    if (others.length > 0) {
      throw AppError.conflict(
        'Ya existe una disponibilidad habitual superpuesta para ese profesional y día.',
      );
    }
  }
}
