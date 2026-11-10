import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  careGroupQuerySchema,
  createCareGroupSchema,
  entityStatusUpdateSchema,
  idSchema,
  updateCareGroupSchema,
  type CareGroup,
  type CareGroupQuery,
  type CreateCareGroupInput,
  type EntityStatusUpdate,
  type PaginatedResult,
  type SessionUser,
  type UpdateCareGroupInput,
} from '@plaza/shared';
import { CareGroupsService } from './care-groups.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

@Controller('care-groups')
export class CareGroupsController {
  constructor(private readonly groups: CareGroupsService) {}

  @Get()
  @RequirePermissions('groups:read')
  list(
    @CurrentUser() user: SessionUser,
    @Query(zod(careGroupQuerySchema)) query: CareGroupQuery,
  ): Promise<PaginatedResult<CareGroup>> {
    return this.groups.list(user, query);
  }

  @Get(':id')
  @RequirePermissions('groups:read')
  get(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<CareGroup> {
    return this.groups.get(user, id);
  }

  @Post()
  @RequirePermissions('groups:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createCareGroupSchema)) input: CreateCareGroupInput,
  ): Promise<CareGroup> {
    return this.groups.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('groups:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateCareGroupSchema)) input: UpdateCareGroupInput,
  ): Promise<CareGroup> {
    return this.groups.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('groups:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(entityStatusUpdateSchema)) input: EntityStatusUpdate,
  ): Promise<CareGroup> {
    return this.groups.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('groups:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.groups.remove(actor, id);
  }
}
