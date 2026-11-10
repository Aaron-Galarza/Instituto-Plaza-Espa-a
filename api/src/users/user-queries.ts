import { paginate, type PaginatedResult, type User, type UserQuery } from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { toPublicUser } from './user-helpers';

export class UserQueries {
  constructor(private readonly store: DataStore) {}
  async list(query: UserQuery): Promise<PaginatedResult<User>> {
    const users = await this.store.repo('users').all();
    const search = query.search?.toLowerCase();
    const filtered = users.filter((user) => {
      if (query.role && user.role !== query.role) return false;
      if (query.status && user.status !== query.status) return false;
      if (search) {
        const haystack = `${user.name} ${user.email}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const page = paginate(filtered, query.page, query.pageSize);
    return { ...page, items: page.items.map((user) => toPublicUser(user)) };
  }

  async get(id: string): Promise<User> {
    const user = await this.store.repo('users').findById(id);
    if (!user) throw AppError.notFound('Usuario');
    return toPublicUser(user);
  }
}
