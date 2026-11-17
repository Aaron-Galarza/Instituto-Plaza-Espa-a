import {
  changeRequestQuerySchema,
  paginate,
  type ChangeRequest,
  type PaginatedResult,
  type Professional,
  type SessionUser,
  type Space,
} from '@plaza/shared';
import type { z } from 'zod';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { normalizeForSearch } from '../common/search';
import { sanitizeProfessional } from '../professionals/professional-validation';
import { loadSchedulingContext } from '../scheduling/context';
import { assertRuleAccess, findOccurrence } from './change-request-helpers';

type ChangeRequestQueryInput = z.infer<typeof changeRequestQuerySchema>;

export class ChangeRequestQueries {
  constructor(private readonly store: DataStore) {}
  async options(user: SessionUser, ruleId: string, date: string): Promise<{
    professionals: Professional[]; spaces: Space[];
  }> {
    const rule = await this.store.repo('scheduleRules').findById(ruleId);
    if (!rule) throw AppError.notFound('Jornada');
    const ctx = await loadSchedulingContext(this.store);
    assertRuleAccess(user, rule, ctx);
    const occurrence = findOccurrence(ctx, ruleId, date);
    if (!occurrence) throw AppError.notFound('Jornada de esa fecha');
    const ownSegments = user.role === 'professional'
      ? occurrence.segments.filter((segment) =>
          segment.professionalIds.includes(user.professionalId ?? '') ||
          Boolean(segment.groupId && ctx.groups.find((group) =>
            group.id === segment.groupId && group.professionalIds.includes(user.professionalId ?? ''))))
      : occurrence.segments;
    const professionals = ctx.professionals.filter((professional) =>
      professional.status === 'active' && ownSegments.some((segment) => {
        const group = ctx.groups.find((item) => item.id === segment.groupId);
        if (group) return group.professionalIds.includes(professional.id);
        return professional.specialties.some((name) =>
          normalizeForSearch(name) === normalizeForSearch(segment.serviceName));
      }));
    return {
      professionals: professionals.map((professional) => sanitizeProfessional(professional, user)),
      spaces: ctx.spaces.filter((space) => space.status === 'active'),
    };
  }
  async list(
    user: SessionUser,
    query: ChangeRequestQueryInput,
  ): Promise<PaginatedResult<ChangeRequest>> {
    let requests = await this.store.repo('changeRequests').all();
    const onlyMine = user.role === 'professional' || query.mine;
    if (onlyMine) requests = requests.filter((request) => request.requesterId === user.id);
    if (query.status) requests = requests.filter((request) => request.status === query.status);
    if (query.type) requests = requests.filter((request) => request.type === query.type);

    requests.sort(
      (a, b) =>
        (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
        b.createdAt.localeCompare(a.createdAt),
    );
    return paginate(requests, query.page, query.pageSize);
  }

  async get(user: SessionUser, id: string): Promise<ChangeRequest> {
    const request = await this.store.repo('changeRequests').findById(id);
    if (!request) throw AppError.notFound('Solicitud');
    if (user.role === 'professional' && request.requesterId !== user.id) {
      throw AppError.forbidden('No tenés acceso a esta solicitud.');
    }
    return request;
  }
}
