import { AVAILABILITY_KIND_LABELS, WEEKDAY_LABELS, minutesToTime, type Professional, type ProfessionalAvailability } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';
import { today } from '@/lib/format';
import type { AvailabilityFormValues, Tab } from './availability-form';

export function availabilityFields(professionals: Professional[], editing: ProfessionalAvailability | null, professionalId: string, tab: Tab) {
  const formDefaults: AvailabilityFormValues = editing
    ? {
        professionalId: editing.professionalId,
        kind: editing.kind,
        dayOfWeek: editing.dayOfWeek ? String(editing.dayOfWeek) : '',
        startTime: minutesToTime(editing.startMinute),
        endTime: minutesToTime(editing.endMinute),
        effectiveFrom: editing.effectiveFrom,
        effectiveTo: editing.effectiveTo ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
      }
    : {
        professionalId:
          professionalId || professionals.find((item) => item.status === 'active')?.id || '',
        kind: tab === 'absences' ? 'absence' : 'regular',
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '12:00',
        effectiveFrom: today(),
        effectiveTo: '',
        status: 'active',
        notes: '',
      };

  const professionalOptions = professionals
    .filter(
      (professional) =>
        professional.status === 'active' || professional.id === editing?.professionalId,
    )
    .map((professional) => ({
      value: professional.id,
      label: `${professional.firstName} ${professional.lastName}${
        professional.status === 'inactive' ? ' (inactivo)' : ''
      }`,
    }));

  const fields: EntityField[] = [
    ...(editing
      ? []
      : ([
          {
            name: 'professionalId',
            label: 'Profesional',
            type: 'select',
            required: true,
            options: professionalOptions,
          },
        ] satisfies EntityField[])),
    {
      name: 'kind',
      label: 'Tipo de registro',
      type: 'select',
      required: true,
      options: (
        Object.entries(AVAILABILITY_KIND_LABELS) as Array<
          [keyof typeof AVAILABILITY_KIND_LABELS, string]
        >
      ).map(([value, label]) => ({ value, label })),
      hint: 'Las ausencias generan afectaciones sobre las jornadas ya programadas.',
    },
    {
      name: 'dayOfWeek',
      label: 'Día de la semana',
      type: 'select',
      required: true,
      options: Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({ value, label })),
      visible: (values) => values.kind === 'regular',
    },
    {
      name: 'startTime',
      label: 'Hora desde',
      type: 'time',
      required: true,
    },
    {
      name: 'endTime',
      label: 'Hora hasta',
      type: 'time',
      required: true,
    },
    {
      name: 'effectiveFrom',
      label: 'Vigencia desde',
      type: 'date',
      required: true,
      hint: 'Primer día en que aplica el registro.',
    },
    {
      name: 'effectiveTo',
      label: 'Vigencia hasta',
      type: 'date',
      hint: 'Obligatoria para ausencias; opcional para horarios habituales y bloqueos.',
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
      placeholder: 'Motivo de la ausencia, indicaciones de cobertura u observaciones.',
    },
  ];

  return { formDefaults, fields };
}
