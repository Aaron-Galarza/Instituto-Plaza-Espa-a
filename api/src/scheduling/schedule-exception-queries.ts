import { type ScheduleException, type SessionUser } from '@plaza/shared';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from './context';

export async function listExceptions(
  store: DataStore,
  user: SessionUser,
  scheduleRuleId?: string,
  from?: string,
  to?: string,
): Promise<ScheduleException[]> {
  const ctx = await loadSchedulingContext(store);
  let allowedRuleIds: Set<string> | null = null;
  if (user.role === 'professional') {
    if (!user.professionalId) return [];
    const groupMap = new Map(ctx.groups.map((group) => [group.id, group]));
    allowedRuleIds = new Set(
      ctx.rules
        .filter((rule) =>
          rule.segments.some(
            (segment) =>
              segment.professionalIds.includes(user.professionalId!) ||
              (segment.groupId
                ? (groupMap.get(segment.groupId)?.professionalIds.includes(user.professionalId!) ??
                  false)
                : false),
          ),
        )
        .map((rule) => rule.id),
    );
  }

  const exceptions = ctx.exceptions.filter((exception) => {
    if (scheduleRuleId && exception.scheduleRuleId !== scheduleRuleId) return false;
    if (allowedRuleIds && !allowedRuleIds.has(exception.scheduleRuleId)) return false;
    if (from && exception.date < from) return false;
    if (to && exception.date > to) return false;
    return true;
  });
  return exceptions.sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
}
