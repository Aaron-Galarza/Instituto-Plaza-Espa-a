import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  auditQuerySchema,
  paginate,
  type AuditEvent,
  type PaginatedResult,
  type SessionUser,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';
import type { AuditQueryInput } from './audit.types';

@Controller('audit')
export class AuditController {
  constructor(@Inject(DATA_STORE) private readonly store: DataStore) {}

  @Get()
  @RequirePermissions('audit:read')
  async list(
    @Query(zod(auditQuerySchema)) query: AuditQueryInput,
    @CurrentUser() user: SessionUser,
  ): Promise<PaginatedResult<AuditEvent>> {
    const items = await this.store.repo('auditEvents').where((event) => {
      if (query.entity && event.entity !== query.entity) return false;
      if (query.entityId && event.entityId !== query.entityId) return false;
      if (query.userId && event.userId !== query.userId) return false;
      if (query.action && !event.action.startsWith(query.action)) return false;
      if (query.from && event.at.slice(0, 10) < query.from) return false;
      if (query.to && event.at.slice(0, 10) > query.to) return false;
      return true;
    });

    const filtered =
      user.role === 'professional' ? items.filter((event) => event.userId === user.id) : items;

    filtered.sort((a, b) => b.at.localeCompare(a.at));
    return paginate(filtered, query.page, query.pageSize);
  }
}
