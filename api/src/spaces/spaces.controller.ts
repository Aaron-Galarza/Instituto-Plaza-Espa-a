import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createSpaceSchema,
  entityStatusUpdateSchema,
  idSchema,
  spaceQuerySchema,
  updateSpaceSchema,
  type CreateSpaceInput,
  type EntityStatusUpdate,
  type PaginatedResult,
  type SessionUser,
  type Space,
  type SpaceQuery,
  type UpdateSpaceInput,
} from '@plaza/shared';
import { SpacesService } from './spaces.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Get()
  @RequirePermissions('spaces:read')
  list(@Query(zod(spaceQuerySchema)) query: SpaceQuery): Promise<PaginatedResult<Space>> {
    return this.spaces.list(query);
  }

  @Get(':id')
  @RequirePermissions('spaces:read')
  get(@Param('id', zod(idSchema)) id: string): Promise<Space> {
    return this.spaces.get(id);
  }

  @Post()
  @RequirePermissions('spaces:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createSpaceSchema)) input: CreateSpaceInput,
  ): Promise<Space> {
    return this.spaces.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('spaces:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateSpaceSchema)) input: UpdateSpaceInput,
  ): Promise<Space> {
    return this.spaces.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('spaces:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(entityStatusUpdateSchema)) input: EntityStatusUpdate,
  ): Promise<Space> {
    return this.spaces.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('spaces:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.spaces.remove(actor, id);
  }
}
