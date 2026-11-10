/* ---------------------------------------------------------------------------
 * Utilidades de fecha y hora del dominio.
 * Convención: fechas YYYY-MM-DD (fecha calendario institucional), minutos
 * desde medianoche para horarios y semanas ISO (lunes = 1, domingo = 7).
 * Zona horaria institucional: America/Argentina/Cordoba.
 * ------------------------------------------------------------------------- */

export const INSTITUTION_TIMEZONE = 'America/Argentina/Cordoba';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function parseDateOnly(value: string): Date {
  if (!isDateOnly(value)) throw new Error(`Fecha inválida: ${value}`);
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayInInstitutionTz(now: Date = new Date()): string {
  // en-CA produce YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INSTITUTION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function addMonths(dateOnly: string, months: number): string {
  const date = parseDateOnly(dateOnly);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return formatDateOnly(date);
}

export function isoWeekday(dateOnly: string): number {
  const day = parseDateOnly(dateOnly).getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(dateOnly: string): string {
  return addDays(dateOnly, -(isoWeekday(dateOnly) - 1));
}

export function endOfWeek(dateOnly: string): string {
  return addDays(startOfWeek(dateOnly), 6);
}

export function startOfMonth(dateOnly: string): string {
  return `${dateOnly.slice(0, 7)}-01`;
}

export function endOfMonth(dateOnly: string): string {
  const [year, month] = dateOnly.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${dateOnly.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  let guard = 0;
  while (cursor <= to && guard < 3700) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86_400_000);
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.trunc(minutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function timeToMinutes(time: string): number {
  const match = TIME_RE.exec(time);
  if (!match) throw new Error(`Hora inválida: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatMinutesRange(start: number, end: number): string {
  return `${minutesToTime(start)}–${minutesToTime(end)}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatLongDate(dateOnly: string): string {
  return LONG_DATE_FORMATTER.format(parseDateOnly(dateOnly));
}

export function formatShortDate(dateOnly: string): string {
  return SHORT_DATE_FORMATTER.format(parseDateOnly(dateOnly));
}

export function formatMonth(dateOnly: string): string {
  return MONTH_FORMATTER.format(parseDateOnly(dateOnly));
}

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export const WEEKDAY_SHORT_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

/** Compara intervalos semiabiertos [aStart, aEnd) y [bStart, bEnd). */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatIsoDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: INSTITUTION_TIMEZONE,
  }).format(new Date(value));
}
