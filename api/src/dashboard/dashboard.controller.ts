import { Controller, Get, Query } from '@nestjs/common';
import { dashboardQuerySchema, type DashboardResponse } from '@plaza/shared';
import type { z } from 'zod';
import { DashboardService } from './dashboard.service';
import { RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard:read')
  get(@Query(zod(dashboardQuerySchema)) query: DashboardQueryInput): Promise<DashboardResponse> {
    return this.dashboard.get(query.from, query.to);
  }
}
