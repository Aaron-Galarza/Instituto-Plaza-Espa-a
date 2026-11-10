import {
  changeRequestQuerySchema,
  paginate,
  type ChangeRequest,
  type PaginatedResult,
  type SessionUser,
} from '@plaza/shared';
import type { z } from 'zod';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';

type ChangeRequestQueryInput = z.infer<typeof changeRequestQuerySchema>;

export class ChangeRequestQueries {
  constructor(private readonly store: DataStore) {}
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
