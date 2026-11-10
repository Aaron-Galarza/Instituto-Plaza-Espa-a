import { timeToMinutes, type AssignmentIssueDetail, type CreateAvailabilityInput, type ProfessionalAvailability, type UpdateAvailabilityInput } from '@plaza/shared';
import { z } from 'zod';
import { shortDate } from '@/lib/format';

export type Tab = 'regular' | 'absences' | 'issues';
export type IssueStatusFilter = 'all' | 'pending' | 'resolved' | 'dismissed';
export type ResolutionAction = 'reassign' | 'reschedule' | 'cancel_date' | 'dismiss';

export interface AvailabilitySaveResponse {
  entry: ProfessionalAvailability;
  issues: AssignmentIssueDetail[];
}

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeMinutes(value: string): number {
  return TIME_PATTERN.test(value) ? timeToMinutes(value) : 0;
}

/**
 * El formulario trabaja con horas legibles; la API recibe minutos desde medianoche.
 * La validación se repite en el cliente para dar feedback inmediato.
 */
export const availabilityFormSchema = z
  .object({
    professionalId: z.string().min(1, 'Seleccioná un profesional'),
    kind: z.enum(['regular', 'absence', 'block']),
    dayOfWeek: z.string(),
    startTime: z.string().regex(TIME_PATTERN, 'Ingresá una hora válida'),
    endTime: z.string().regex(TIME_PATTERN, 'Ingresá una hora válida'),
    effectiveFrom: z.string().min(1, 'Indicá el inicio de vigencia'),
    effectiveTo: z.string(),
    status: z.enum(['active', 'inactive']),
    notes: z.string().max(300, 'Máximo 300 caracteres'),
  })
  .superRefine((value, ctx) => {
    if (
      TIME_PATTERN.test(value.startTime) &&
      TIME_PATTERN.test(value.endTime) &&
      safeMinutes(value.startTime) >= safeMinutes(value.endTime)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'La hora de inicio debe ser anterior al fin',
        path: ['endTime'],
      });
    }
    if (value.kind === 'regular' && !value.dayOfWeek) {
      ctx.addIssue({
        code: 'custom',
        message: 'Elegí el día de la semana',
        path: ['dayOfWeek'],
      });
    }
    if (value.kind === 'absence' && !value.effectiveTo) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indicá la fecha de finalización de la ausencia',
        path: ['effectiveTo'],
      });
    }
    if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
      ctx.addIssue({
        code: 'custom',
        message: 'La vigencia hasta no puede ser anterior al inicio',
        path: ['effectiveTo'],
      });
    }
  });

export interface AvailabilityFormValues {
  professionalId: string;
  kind: 'regular' | 'absence' | 'block';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'active' | 'inactive';
  notes: string;
}

export function toCreateInput(values: AvailabilityFormValues): CreateAvailabilityInput {
  return {
    professionalId: values.professionalId,
    kind: values.kind,
    dayOfWeek: values.kind === 'regular' ? Number(values.dayOfWeek) : null,
    startMinute: timeToMinutes(values.startTime),
    endMinute: timeToMinutes(values.endTime),
    effectiveFrom: values.effectiveFrom,
    effectiveTo: values.effectiveTo || undefined,
    status: values.status,
    notes: values.notes.trim() || undefined,
  };
}

export function toUpdateInput(values: AvailabilityFormValues): UpdateAvailabilityInput {
  return {
    kind: values.kind,
    dayOfWeek: values.kind === 'regular' ? Number(values.dayOfWeek) : null,
    startMinute: timeToMinutes(values.startTime),
    endMinute: timeToMinutes(values.endTime),
    effectiveFrom: values.effectiveFrom,
    effectiveTo: values.effectiveTo || null,
    status: values.status,
    notes: values.notes.trim(),
  };
}

export function validityLabel(entry: ProfessionalAvailability): string {
  if (!entry.effectiveTo) return `Desde ${shortDate(entry.effectiveFrom)}`;
  if (entry.effectiveTo === entry.effectiveFrom) return shortDate(entry.effectiveFrom);
  return `${shortDate(entry.effectiveFrom)} — ${shortDate(entry.effectiveTo)}`;
}

export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
