import { ROLE_DESCRIPTIONS, ROLE_LABELS, type User, type Professional } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export function userDefaults(editing: User | null) {
  return editing ? { name: editing.name, email: editing.email, role: editing.role,
    professionalId: editing.professionalId ?? '', status: editing.status }
    : { name: '', email: '', password: '', role: 'professional', professionalId: '' };
}

export function userFields(professionals: Professional[], editing: User | null) {
  const professionalOptions = professionals
    .filter((professional) => professional.status === 'active' || professional.id === editing?.professionalId)
    .map((professional) => ({ value: professional.id, label: `${professional.firstName} ${professional.lastName}` }));
  const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
  const createFields: EntityField[] = [
    { name: 'name', label: 'Nombre y apellido', required: true },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
    {
      name: 'password',
      label: 'Contraseña inicial',
      type: 'password',
      required: true,
      hint: 'Mínimo 10 caracteres, con letras y números. La persona podrá cambiarla.',
    },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: roleOptions,
      hint: Object.entries(ROLE_DESCRIPTIONS)
        .map(([key, text]) => `${ROLE_LABELS[key as keyof typeof ROLE_LABELS]}: ${text}`)
        .join(' '),
    },
    {
      name: 'professionalId',
      label: 'Profesional vinculado',
      type: 'select',
      placeholder: 'Sin vínculo',
      options: professionalOptions,
      hint: 'Obligatorio para que un usuario profesional vea su propia agenda.',
    },
  ];

  const editFields: EntityField[] = [
    { name: 'name', label: 'Nombre y apellido', required: true },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: roleOptions,
    },
    {
      name: 'professionalId',
      label: 'Profesional vinculado',
      type: 'select',
      placeholder: 'Sin vínculo',
      options: professionalOptions,
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
  ];

  return { createFields, editFields, roleOptions };
}
