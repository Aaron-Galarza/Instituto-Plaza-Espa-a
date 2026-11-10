import { MODALITY_LABELS, type CareGroup, type Service, type Professional, type Space } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export function groupDefaults(editing: CareGroup | null) {
  return editing ? {
    name: editing.name, serviceId: editing.serviceId, professionalIds: editing.professionalIds,
    spaceId: editing.spaceId ?? '', capacity: editing.capacity, modality: editing.modality,
    notes: editing.notes ?? '', status: editing.status,
  } : {
    name: '', serviceId: '', professionalIds: [], spaceId: '', capacity: 1,
    modality: 'group', notes: '', status: 'active',
  };
}

export function groupFields(services: Service[], professionals: Professional[], spaces: Space[], editing: CareGroup | null): EntityField[] {
  const fields: EntityField[] = [
    {
      name: 'name',
      label: 'Nombre del grupo',
      required: true,
      span2: true,
      placeholder: 'Grupo de marcha, Taller de memoria…',
    },
    {
      name: 'serviceId',
      label: 'Prestación',
      type: 'select',
      required: true,
      options: services
        .filter((service) => service.status === 'active' || service.id === editing?.serviceId)
        .map((service) => ({ value: service.id, label: service.name })),
    },
    {
      name: 'modality',
      label: 'Modalidad',
      type: 'select',
      required: true,
      options: [
        { value: 'group', label: MODALITY_LABELS.group },
        { value: 'shared', label: MODALITY_LABELS.shared },
      ],
    },
    {
      name: 'capacity',
      label: 'Capacidad del grupo',
      type: 'number',
      required: true,
      min: 1,
      max: 200,
      hint: 'Cupo máximo de pacientes simultáneos.',
    },
    {
      name: 'professionalIds',
      label: 'Profesionales del grupo',
      type: 'checkboxes',
      required: true,
      options: professionals
        .filter(
          (professional) =>
            professional.status === 'active' ||
            (editing?.professionalIds ?? []).includes(professional.id),
        )
        .map((professional) => ({
          value: professional.id,
          label: `${professional.firstName} ${professional.lastName}${professional.status === 'inactive' ? ' (inactivo)' : ''}`,
        })),
    },
    {
      name: 'spaceId',
      label: 'Espacio habitual',
      type: 'select',
      placeholder: 'Sin espacio asignado',
      options: spaces
        .filter((space) => space.status === 'active' || space.id === editing?.spaceId)
        .map((space) => ({
          value: space.id,
          label: `${space.name} · capacidad ${space.capacity}`,
        })),
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
    {
      name: 'notes',
      label: 'Notas',
      type: 'textarea',
      placeholder: 'Indicaciones operativas del grupo.',
    },
  ];
  return fields;
}
