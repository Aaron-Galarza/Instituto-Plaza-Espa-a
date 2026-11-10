import type { Space } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export const spaceFields: EntityField[] = [
    {
      name: 'name',
      label: 'Nombre',
      required: true,
      span2: true,
      placeholder: 'Consultorio 1, Sala de kinesiología…',
    },
    {
      name: 'capacity',
      label: 'Capacidad simultánea',
      type: 'number',
      required: true,
      min: 1,
      max: 500,
      hint: 'Cantidad máxima de pacientes que pueden estar en el espacio al mismo tiempo.',
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
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Equipamiento, ubicación o restricciones operativas.',
    },
  ];

export function spaceDefaults(editing: Space | null) {
  return editing
    ? { name: editing.name, description: editing.description ?? '', capacity: editing.capacity, status: editing.status }
    : { name: '', description: '', capacity: 1, status: 'active' };
}
