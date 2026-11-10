import { eachDate, isoWeekday, type ScheduleRule, type ScheduleSegment } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';
import { expandOccurrences } from './engine';
import type { ValidationWindow } from './schedule-validation';

export async function assertCompatibleGroupSessionTx(
  tx: DataStore,
  date: string,
  segments: Array<
    Pick<
      ScheduleSegment,
      'serviceId' | 'professionalIds' | 'groupId' | 'spaceId' | 'startMinute' | 'endMinute'
    >
  >,
  excludeRuleId: string,
): Promise<void> {
  const grouped = segments.filter((segment) => segment.groupId);
  if (grouped.length === 0) return;
  const ctx = await loadSchedulingContext(tx);
  const groups = new Map(ctx.groups.map((group) => [group.id, group]));
  const peers = expandOccurrences(ctx, date, date).filter(
    (item) => item.ruleId !== excludeRuleId && item.status !== 'cancelled',
  );
  for (const segment of grouped) {
    const compatible = peers.some((item) =>
      item.segments.some(
        (peer) =>
          peer.groupId === segment.groupId &&
          peer.serviceId === segment.serviceId &&
          peer.startMinute === segment.startMinute &&
          peer.endMinute === segment.endMinute &&
          peer.spaceId === (segment.spaceId ?? groups.get(segment.groupId!)?.spaceId ?? null) &&
          [...peer.professionalIds].sort().join('|') ===
            [
              ...(segment.professionalIds.length
                ? segment.professionalIds
                : (groups.get(segment.groupId!)?.professionalIds ?? [])),
            ]
              .sort()
              .join('|'),
      ),
    );
    if (!compatible) {
      throw AppError.conflict(
        'El tramo grupal no coincide con una actividad del grupo en la fecha y horario elegidos. Modificá el bloque grupal completo o quitá la asignación al grupo.',
      );
    }
  }
}

export async function assertGroupedFutureCompatibleTx(
  tx: DataStore,
  original: ScheduleRule,
  next: ScheduleRule,
  window: ValidationWindow | null,
): Promise<void> {
  if (!window) return;
  const changed = next.segments.filter((segment) => {
    if (!segment.groupId) return false;
    const prior = original.segments.find((item) => item.id === segment.id);
    return (
      !prior ||
      prior.groupId !== segment.groupId ||
      prior.startMinute !== segment.startMinute ||
      prior.endMinute !== segment.endMinute ||
      prior.spaceId !== segment.spaceId ||
      [...prior.professionalIds].sort().join('|') !== [...segment.professionalIds].sort().join('|')
    );
  });
  if (!changed.length) return;
  for (const date of eachDate(window.from, window.to)) {
    if (!next.daysOfWeek.includes(isoWeekday(date))) continue;
    await assertCompatibleGroupSessionTx(tx, date, changed, original.id);
  }
}
