import { DEFAULT_PROFESSIONAL_COLOR, type Professional, type Service, type User } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export function professionalDefaults(editing: Professional | null) {
  return editing ? {
    firstName: editing.firstName, lastName: editing.lastName, specialties: editing.specialties,
    color: editing.color, phone: editing.phone ?? '', email: editing.email ?? '',
    userId: editing.userId ?? '', status: editing.status,
  } : { firstName: '', lastName: '', specialties: [], color: DEFAULT_PROFESSIONAL_COLOR,
    phone: '', email: '', userId: '', status: 'active' };
}

export function professionalFields(canSeeUsers: boolean, users: User[], services: Service[], editing: Professional | null): EntityField[] {
  const options = services.filter((service) => service.status === 'active').map((service) => ({
    value: service.name, label: service.name,
  }));
  for (const name of editing?.specialties ?? []) {
    if (!options.some((option) => option.value === name)) options.push({ value: name, label: `${name} (no disponible)` });
  }
  const fields: EntityField[] = [
    { name: 'firstName', label: 'Nombre', required: true },
    { name: 'lastName', label: 'Apellido', required: true },
    {
      name: 'specialties',
      label: 'Prestaciones',
      type: 'checkboxes',
      required: true,
      span2: true,
      options,
      hint: 'Elegí las prestaciones cargadas en el sistema. Si no hay opciones, creá una en Prestaciones primero.',
    },
    {
      name: 'color',
      label: 'Color en la agenda',
      type: 'color',
      hint: 'Se usa para identificar al profesional en la agenda y el tablero.',
    },
    { name: 'phone', label: 'Teléfono', type: 'tel' },
    { name: 'email', label: 'Correo personal', type: 'email' },
    ...(canSeeUsers
      ? [
          {
            name: 'userId',
            label: 'Usuario vinculado',
            type: 'select' as const,
            placeholder: 'Sin usuario vinculado',
            hint: 'Permite que la persona vea su propia agenda al ingresar.',
            options: (users).map((user) => ({
              value: user.id,
              label: `${user.name} · ${user.email}`,
            })),
          },
        ]
      : []),
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
  ];
  return fields;
}
