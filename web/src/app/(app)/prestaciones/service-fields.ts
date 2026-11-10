import { MODALITY_LABELS, type Service } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

const MODALITY_OPTIONS = Object.entries(MODALITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const serviceFields: EntityField[] = [
    {
      name: 'name',
      label: 'Nombre',
      required: true,
      span2: true,
      placeholder: 'Kinesiología individual, Taller grupal…',
    },
    {
      name: 'allowedModalities',
      label: 'Modalidades habilitadas',
      type: 'checkboxes',
      required: true,
      options: MODALITY_OPTIONS,
      hint: 'Individual: un paciente por profesional. Grupal: cupo de grupo. Compartida: varios pacientes en simultáneo.',
    },
    {
      name: 'suggestedDurationMinutes',
      label: 'Duración sugerida (minutos)',
      type: 'number',
      min: 5,
      max: 480,
      hint: 'Opcional. Ayuda a completar los tramos de la agenda.',
    },
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
      placeholder: 'Indicaciones operativas de la prestación.',
    },
  ];

export function serviceDefaults(editing: Service | null) {
  return editing
    ? { name: editing.name, description: editing.description ?? '', allowedModalities: editing.allowedModalities, suggestedDurationMinutes: editing.suggestedDurationMinutes ?? '', status: editing.status }
    : { name: '', description: '', allowedModalities: ['individual'], suggestedDurationMinutes: '', status: 'active' };
}
