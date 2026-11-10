import type { SchedulingContext } from './scheduling.types';
import type { AddConflict, Instance } from './conflict-types';

export function checkReferences(
  ctx: SchedulingContext,
  instances: Instance[],
  add: AddConflict,
): void {
  const patientMap = new Map(ctx.patients.map((patient) => [patient.id, patient]));
  const professionalMap = new Map(ctx.professionals.map((item) => [item.id, item]));
  const serviceMap = new Map(ctx.services.map((item) => [item.id, item]));
  const spaceMap = new Map(ctx.spaces.map((item) => [item.id, item]));
  const groupMap = new Map(ctx.groups.map((item) => [item.id, item]));
  // Referencias e integridad del tramo
  for (const instance of instances) {
    const { occurrence, segment } = instance;
    const patient = patientMap.get(occurrence.patientId);
    if (!patient) {
      add({
        severity: 'error',
        code: 'invalid_reference',
        message: 'El paciente de la jornada ya no existe.',
        date: occurrence.date,
        instances: [instance],
        extra: 'patient',
      });
    } else if (patient.status !== 'active') {
      add({
        severity: 'error',
        code: 'invalid_reference',
        message: `El paciente ${patient.firstName} ${patient.lastName} está inactivo.`,
        date: occurrence.date,
        instances: [instance],
        extra: 'patient-inactive',
      });
    }

    const service = serviceMap.get(segment.serviceId);
    if (!service) {
      add({
        severity: 'error',
        code: 'invalid_reference',
        message: 'La prestación del tramo ya no existe.',
        date: occurrence.date,
        instances: [instance],
        extra: 'service',
      });
    } else if (service.status !== 'active') {
      add({
        severity: 'error',
        code: 'invalid_reference',
        message: `La prestación "${service.name}" está inactiva.`,
        date: occurrence.date,
        instances: [instance],
        extra: 'service-inactive',
      });
    }

    if (segment.startMinute < occurrence.startMinute || segment.endMinute > occurrence.endMinute) {
      add({
        severity: 'error',
        code: 'outside_rule_bounds',
        message: 'Un tramo queda fuera del horario de la jornada.',
        date: occurrence.date,
        instances: [instance],
        extra: 'bounds',
      });
    }

    if (segment.professionalIds.length === 0) {
      add({
        severity: 'error',
        code: 'missing_professional',
        message: 'El tramo no tiene profesional asignado.',
        date: occurrence.date,
        instances: [instance],
        extra: 'missing-professional',
      });
    }
    for (const professionalId of segment.professionalIds) {
      const professional = professionalMap.get(professionalId);
      if (!professional) {
        add({
          severity: 'error',
          code: 'invalid_reference',
          message: 'Un profesional asignado ya no existe.',
          date: occurrence.date,
          instances: [instance],
          extra: `professional-${professionalId}`,
        });
      } else if (professional.status !== 'active') {
        add({
          severity: 'error',
          code: 'invalid_reference',
          message: `El profesional ${professional.firstName} ${professional.lastName} está inactivo.`,
          date: occurrence.date,
          instances: [instance],
          extra: `professional-inactive-${professionalId}`,
        });
      }
    }

    if (segment.spaceId) {
      const space = spaceMap.get(segment.spaceId);
      if (!space) {
        add({
          severity: 'error',
          code: 'invalid_reference',
          message: 'El espacio asignado ya no existe.',
          date: occurrence.date,
          instances: [instance],
          extra: 'space',
        });
      } else if (space.status !== 'active') {
        add({
          severity: 'error',
          code: 'invalid_reference',
          message: `El espacio "${space.name}" está inactivo.`,
          date: occurrence.date,
          instances: [instance],
          extra: 'space-inactive',
        });
      }
    }

    if (segment.groupId) {
      const group = groupMap.get(segment.groupId);
      if (!group) {
        add({
          severity: 'error',
          code: 'invalid_reference',
          message: 'El grupo asignado ya no existe.',
          date: occurrence.date,
          instances: [instance],
          extra: 'group',
        });
      } else {
        if (group.status !== 'active') {
          add({
            severity: 'error',
            code: 'invalid_reference',
            message: `El grupo "${group.name}" está inactivo.`,
            date: occurrence.date,
            instances: [instance],
            extra: 'group-inactive',
          });
        }
        if (group.serviceId !== segment.serviceId) {
          add({
            severity: 'error',
            code: 'group_mismatch',
            message: `El tramo no coincide con la prestación del grupo "${group.name}".`,
            date: occurrence.date,
            instances: [instance],
            extra: 'group-service',
          });
        }
        if (group.modality !== segment.modality) {
          add({
            severity: 'error',
            code: 'group_mismatch',
            message: `La modalidad del tramo no coincide con la del grupo "${group.name}".`,
            date: occurrence.date,
            instances: [instance],
            extra: 'group-modality',
          });
        }
        const outsiders = segment.professionalIds.filter(
          (professionalId) => !group.professionalIds.includes(professionalId),
        );
        if (outsiders.length > 0) {
          add({
            severity: 'error',
            code: 'professional_not_in_group',
            message: `Hay profesionales asignados que no pertenecen al grupo "${group.name}".`,
            date: occurrence.date,
            instances: [instance],
            extra: `outsiders-${outsiders.sort().join('-')}`,
          });
        }
      }
    } else if (segment.modality === 'group') {
      add({
        severity: 'error',
        code: 'group_mismatch',
        message: 'La modalidad grupal requiere un grupo de atención.',
        date: occurrence.date,
        instances: [instance],
        extra: 'group-required',
      });
    }
  }
}
