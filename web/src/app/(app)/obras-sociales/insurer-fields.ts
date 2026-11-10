import type { Insurer } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export const insurerFields: EntityField[] = [
    {
      name: 'name',
      label: 'Nombre',
      required: true,
      span2: true,
      placeholder: 'Obra social o financiador',
    },
    { name: 'code', label: 'Código interno', placeholder: 'Ej. OSDE, IOSPER…' },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activa' },
        { value: 'inactive', label: 'Inactiva' },
      ],
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Observaciones administrativas.',
    },
  ];

export function insurerDefaults(editing: Insurer | null) {
  return editing
    ? { name: editing.name, code: editing.code ?? '', description: editing.description ?? '', status: editing.status }
    : { name: '', code: '', description: '', status: 'active' };
}
