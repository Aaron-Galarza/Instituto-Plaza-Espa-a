import type { ScheduleConflict } from '@plaza/shared';
import { ApiError } from './api';

/** Extrae conflictos de agenda del detalle de error del backend. */
export function conflictsFromError(error: unknown): ScheduleConflict[] {
  if (!(error instanceof ApiError)) return [];
  const details = error.details;
  const raw = Array.isArray(details)
    ? details
    : details && typeof details === 'object' && 'conflicts' in details
      ? (details as { conflicts?: unknown }).conflicts
      : null;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ScheduleConflict =>
    Boolean(
      item && typeof item === 'object' && 'message' in item && 'severity' in item && 'code' in item,
    ),
  );
}
