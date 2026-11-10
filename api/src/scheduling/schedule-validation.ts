import {
  addDays,
  isoWeekday,
  todayInInstitutionTz,
  type FutureRulePatch,
  type ScheduleConflict,
  type ScheduleRule,
  type ScheduleSegmentInput,
} from '@plaza/shared';
import { AppError } from '../common/errors';

const VALIDATION_HORIZON_DAYS = 84;
export interface ValidationWindow {
  from: string;
  to: string;
}

export interface DateChangePatch {
  startMinute?: number;
  endMinute?: number;
  segments?: ScheduleSegmentInput[];
  notes?: string | null;
  reason?: string;
}

export function assertOccurrenceDate(rule: ScheduleRule, date: string): void {
  if (rule.status !== 'active') {
    throw AppError.conflict('La recurrencia no está activa.');
  }
  if (date < rule.effectiveFrom) {
    throw AppError.validation('La fecha es anterior al inicio de la recurrencia.');
  }
  if (rule.effectiveTo && date > rule.effectiveTo) {
    throw AppError.validation('La fecha es posterior al fin de la recurrencia.');
  }
  if (!rule.daysOfWeek.includes(isoWeekday(date))) {
    throw AppError.validation('La recurrencia no tiene una ocurrencia en esa fecha.');
  }
}

export function assertDatePatch(patch: DateChangePatch): void {
  if (patch.startMinute !== undefined && patch.endMinute !== undefined) {
    if (patch.startMinute >= patch.endMinute) {
      throw AppError.validation('El horario modificado es inválido.');
    }
  }
}

export function validationWindow(
  rule: Pick<ScheduleRule, 'effectiveFrom' | 'effectiveTo'>,
): ValidationWindow | null {
  const today = todayInInstitutionTz();
  const start = rule.effectiveFrom > today ? rule.effectiveFrom : today;
  const horizon = addDays(start, VALIDATION_HORIZON_DAYS - 1);
  const end = rule.effectiveTo && rule.effectiveTo < horizon ? rule.effectiveTo : horizon;
  if (start > end) return null;
  return { from: start, to: end };
}

export function newWarnings(
  before: ScheduleConflict[],
  after: ScheduleConflict[],
  predicate: (conflict: ScheduleConflict) => boolean,
): ScheduleConflict[] {
  const previous = new Set(before.map((conflict) => conflict.id));
  return after.filter(
    (conflict) =>
      conflict.severity === 'warning' && predicate(conflict) && !previous.has(conflict.id),
  );
}

export function assertFutureRuleDate(
  rule: ScheduleRule,
  input: { date: string; changes: FutureRulePatch },
): void {
  if (input.changes.effectiveFrom !== undefined && input.changes.effectiveFrom !== input.date) {
    throw AppError.validation(
      'En un cambio de serie, la nueva vigencia comienza en la fecha indicada.',
    );
  }
  if (input.date < rule.effectiveFrom) {
    throw AppError.validation('La fecha elegida es anterior al inicio de la recurrencia.');
  }
  if (rule.effectiveTo && input.date > rule.effectiveTo) {
    throw AppError.validation('La fecha elegida es posterior al fin de la recurrencia.');
  }
}
