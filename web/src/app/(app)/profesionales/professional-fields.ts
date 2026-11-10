import { DEFAULT_PROFESSIONAL_COLOR, type Professional, type User } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export function professionalDefaults(editing: Professional | null) {
  return editing ? {
    firstName: editing.firstName, lastName: editing.lastName, specialties: editing.specialties.join(', '),
    color: editing.color, phone: editing.phone ?? '', email: editing.email ?? '',
    userId: editing.userId ?? '', status: editing.status,
  } : { firstName: '', lastName: '', specialties: '', color: DEFAULT_PROFESSIONAL_COLOR,
    phone: '', email: '', userId: '', status: 'active' };
}

export function professionalFields(canSeeUsers: boolean, users: User[]): EntityField[] {
  const fields: EntityField[] = [
    { name: 'firstName', label: 'Nombre', required: true },
    { name: 'lastName', label: 'Apellido', required: true },
    {
      name: 'specialties',
      label: 'Especialidades',
      required: true,
      span2: true,
      placeholder: 'Kinesiología, Terapia ocupacional',
      hint: 'Separá las especialidades con comas.',
    },
    {
      name: 'color',
      label: 'Color en la agenda',
      type: 'color',
      hint: 'Se usa para identificar al profesional en la agenda y el tablero.',
    },
    { name: 'phone', label: 'Teléfono', type: 'tel' },
    { name: 'email', label: 'Correo electrónico', type: 'email' },
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
