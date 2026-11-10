import {
  validateRuleShape,
  type CreateScheduleRuleInput,
  type ScheduleRule,
  type ScheduleSegment,
  type ScheduleSegmentInput,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { prepareSegments } from './schedule-segment-input';

export async function prepareRuleInput(
  tx: DataStore,
  input: CreateScheduleRuleInput,
): Promise<{
  patientId: string;
  daysOfWeek: number[];
  effectiveFrom: string;
  effectiveTo: string | null;
  startMinute: number;
  endMinute: number;
  segments: ScheduleSegment[];
  notes: string | null;
}> {
  const patient = await tx.repo('patients').findById(input.patientId);
  if (!patient) throw AppError.validation('El paciente indicado no existe.');
  if (patient.status !== 'active') {
    throw AppError.validation('El paciente está inactivo y no puede programarse.');
  }
  const segments = await prepareSegments(tx, input.segments);
  const shapeIssues = validateRuleShape({
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    segments,
  });
  if (shapeIssues.length > 0) {
    throw AppError.validation(
      'La jornada tiene tramos inválidos.',
      shapeIssues.map((issue) => ({ path: issue.path, message: issue.message })),
    );
  }
  return {
    patientId: input.patientId,
    daysOfWeek: [...new Set(input.daysOfWeek)].sort((a, b) => a - b),
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    segments,
    notes: input.notes ?? null,
  };
}

export async function prepareMergedRule(
  tx: DataStore,
  current: ScheduleRule,
  patch: {
    patientId?: string;
    daysOfWeek?: number[];
    effectiveFrom?: string;
    effectiveTo?: string | null;
    startMinute?: number;
    endMinute?: number;
    segments?: ScheduleSegmentInput[];
    notes?: string | null;
  },
): Promise<{
  patientId: string;
  daysOfWeek: number[];
  effectiveFrom: string;
  effectiveTo: string | null;
  startMinute: number;
  endMinute: number;
  segments: ScheduleSegment[];
  notes: string | null;
}> {
  const patientId = patch.patientId ?? current.patientId;
  const patient = await tx.repo('patients').findById(patientId);
  if (!patient) throw AppError.validation('El paciente indicado no existe.');
  if (patient.status !== 'active' && patientId !== current.patientId) {
    throw AppError.validation('El paciente está inactivo y no puede programarse.');
  }
  const segments = patch.segments ? await prepareSegments(tx, patch.segments) : current.segments;
  const startMinute = patch.startMinute ?? current.startMinute;
  const endMinute = patch.endMinute ?? current.endMinute;
  const effectiveToValue =
    patch.effectiveTo === undefined
      ? (current.effectiveTo ?? null)
      : patch.effectiveTo === ''
        ? null
        : patch.effectiveTo;
  const effectiveFrom = patch.effectiveFrom ?? current.effectiveFrom;

  if (effectiveToValue && effectiveToValue < effectiveFrom) {
    throw AppError.validation('La vigencia hasta no puede ser anterior al inicio.');
  }
  const shapeIssues = validateRuleShape({ startMinute, endMinute, segments });
  if (shapeIssues.length > 0) {
    throw AppError.validation(
      'La nueva versión de la jornada tiene tramos inválidos.',
      shapeIssues.map((issue) => ({ path: issue.path, message: issue.message })),
    );
  }

  return {
    patientId,
    daysOfWeek: [...new Set(patch.daysOfWeek ?? current.daysOfWeek)].sort((a, b) => a - b),
    effectiveFrom,
    effectiveTo: effectiveToValue,
    startMinute,
    endMinute,
    segments,
    notes: patch.notes !== undefined ? patch.notes : (current.notes ?? null),
  };
}
