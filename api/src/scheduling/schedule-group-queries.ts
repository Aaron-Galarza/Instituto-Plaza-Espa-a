import { type GroupOccupancy, type SessionUser } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { buildGroupOccupancy } from './engine';
import { loadSchedulingContext } from './context';

export class ScheduleGroupQueries {
  constructor(private readonly store: DataStore) {}
  async getGroupOccupancy(
    user: SessionUser,
    date: string,
    groupId?: string,
  ): Promise<GroupOccupancy[]> {
    const ctx = await loadSchedulingContext(this.store);
    if (groupId) {
      const group = ctx.groups.find((item) => item.id === groupId);
      if (!group) throw AppError.notFound('Grupo');
      if (
        user.role === 'professional' &&
        (!user.professionalId || !group.professionalIds.includes(user.professionalId))
      ) {
        throw AppError.forbidden('No tenés acceso a este grupo.');
      }
    }
    let occupancy = buildGroupOccupancy(ctx, date, date);
    if (groupId) occupancy = occupancy.filter((item) => item.groupId === groupId);
    if (user.role === 'professional') {
      const professionalId = user.professionalId;
      if (!professionalId) return [];
      const allowedGroupIds = new Set(
        ctx.groups
          .filter((group) => group.professionalIds.includes(professionalId))
          .map((group) => group.id),
      );
      occupancy = occupancy.filter((item) => allowedGroupIds.has(item.groupId));
    }
    return occupancy;
  }
}
