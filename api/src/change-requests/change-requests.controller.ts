import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  cancelChangeRequestSchema,
  adjustChangeRequestSchema,
  changeRequestQuerySchema,
  createChangeRequestSchema,
  idSchema,
  resolveChangeRequestSchema,
  type CancelChangeRequestInput,
  type AdjustChangeRequestInput,
  type ChangeRequest,
  type CreateChangeRequestInput,
  type PaginatedResult,
  type ResolveChangeRequestInput,
  type SessionUser,
} from '@plaza/shared';
import type { z } from 'zod';
import { ChangeRequestsService } from './change-requests.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type ChangeRequestQueryInput = z.infer<typeof changeRequestQuerySchema>;

@Controller('change-requests')
export class ChangeRequestsController {
  constructor(private readonly requests: ChangeRequestsService) {}

  @Get()
  @RequirePermissions('requests:read')
  list(
    @CurrentUser() user: SessionUser,
    @Query(zod(changeRequestQuerySchema)) query: ChangeRequestQueryInput,
  ): Promise<PaginatedResult<ChangeRequest>> {
    return this.requests.list(user, query);
  }

  @Get('scope-note')
  @RequirePermissions('requests:read')
  scopeNote(): { note: string } {
    return { note: this.requests.scopeNote() };
  }

  @Post()
  @RequirePermissions('schedule:read')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createChangeRequestSchema)) input: CreateChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.requests.create(actor, input);
  }

  @Get(':id')
  @RequirePermissions('requests:read')
  get(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<ChangeRequest> {
    return this.requests.get(user, id);
  }

  @Post(':id/approve')
  @RequirePermissions('requests:resolve')
  approve(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(resolveChangeRequestSchema)) input: ResolveChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.requests.approve(actor, id, input);
  }

  @Patch(':id')
  @RequirePermissions('requests:resolve')
  adjust(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(adjustChangeRequestSchema)) input: AdjustChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.requests.adjust(actor, id, input);
  }

  @Post(':id/reject')
  @RequirePermissions('requests:resolve')
  reject(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(resolveChangeRequestSchema)) input: ResolveChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.requests.reject(actor, id, input);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(cancelChangeRequestSchema)) input: CancelChangeRequestInput,
  ): Promise<ChangeRequest> {
    return this.requests.cancel(actor, id, input);
  }
}
