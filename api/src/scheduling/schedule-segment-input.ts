import { randomUUID } from 'node:crypto';
import { type ScheduleSegment, type ScheduleSegmentInput } from '@plaza/shared';
import { AppError } from '../common/errors';
import { uniq } from '../common/search';
import type { DataStore } from '../database/data-store';

export async function prepareSegments(
  tx: DataStore,
  segments: ScheduleSegmentInput[],
): Promise<ScheduleSegment[]> {
  const result: ScheduleSegment[] = [];
  const ids = new Set<string>();
  for (const segment of segments) {
    const service = await tx.repo('services').findById(segment.serviceId);
    if (!service) throw AppError.validation('Una de las prestaciones no existe.');
    if (service.status !== 'active') {
      throw AppError.validation(`La prestación "${service.name}" está inactiva.`);
    }
    if (!service.allowedModalities.includes(segment.modality)) {
      throw AppError.validation(
        `La prestación "${service.name}" no admite la modalidad ${segment.modality}.`,
      );
    }
    const group = segment.groupId ? await tx.repo('careGroups').findById(segment.groupId) : null;
    if (segment.groupId && !group) {
      throw AppError.validation('El grupo indicado no existe.');
    }
    if (group) {
      if (group.status !== 'active') {
        throw AppError.validation(`El grupo "${group.name}" está inactivo.`);
      }
      if (group.serviceId !== segment.serviceId) {
        throw AppError.validation(
          `La prestación del tramo no coincide con la del grupo "${group.name}".`,
        );
      }
      if (group.modality !== segment.modality) {
        throw AppError.validation(
          `La modalidad del tramo no coincide con la del grupo "${group.name}".`,
        );
      }
    } else if (segment.modality === 'group') {
      throw AppError.validation('La modalidad grupal requiere seleccionar un grupo.');
    }

    const professionalIds = uniq(segment.professionalIds);
    if (professionalIds.length === 0 && !group) {
      throw AppError.validation('Cada tramo debe tener al menos un profesional o un grupo.');
    }
    for (const professionalId of professionalIds) {
      const professional = await tx.repo('professionals').findById(professionalId);
      if (!professional) throw AppError.validation('Uno de los profesionales no existe.');
      if (professional.status !== 'active') {
        throw AppError.validation(
          `El profesional ${professional.firstName} ${professional.lastName} está inactivo.`,
        );
      }
      if (group && !group.professionalIds.includes(professionalId)) {
        throw AppError.validation(
          `El profesional ${professional.firstName} ${professional.lastName} no pertenece al grupo "${group.name}".`,
        );
      }
    }

    if (segment.spaceId) {
      const space = await tx.repo('spaces').findById(segment.spaceId);
      if (!space) throw AppError.validation('El espacio indicado no existe.');
      if (space.status !== 'active') {
        throw AppError.validation(`El espacio "${space.name}" está inactivo.`);
      }
      if (group?.spaceId && group.spaceId !== segment.spaceId) {
        throw AppError.validation(`El grupo "${group.name}" está configurado en otro espacio.`);
      }
    }
    if (segment.startMinute >= segment.endMinute) {
      throw AppError.validation('Un tramo debe terminar después de comenzar.');
    }

    let segmentId = segment.id ?? randomUUID();
    if (ids.has(segmentId)) segmentId = randomUUID();
    ids.add(segmentId);

    result.push({
      id: segmentId,
      serviceId: segment.serviceId,
      professionalIds,
      groupId: segment.groupId ?? null,
      spaceId: segment.spaceId ?? null,
      startMinute: segment.startMinute,
      endMinute: segment.endMinute,
      modality: segment.modality,
      notes: segment.notes ?? null,
    });
  }
  return result;
}
