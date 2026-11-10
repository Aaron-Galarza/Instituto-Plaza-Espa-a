import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createInsurerSchema,
  entityStatusUpdateSchema,
  idSchema,
  insurerQuerySchema,
  updateInsurerSchema,
  type CreateInsurerInput,
  type EntityStatusUpdate,
  type Insurer,
  type InsurerQuery,
  type PaginatedResult,
  type SessionUser,
  type UpdateInsurerInput,
} from '@plaza/shared';
import { InsurersService } from './insurers.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

@Controller('insurers')
export class InsurersController {
  constructor(private readonly insurers: InsurersService) {}

  @Get()
  @RequirePermissions('insurers:read')
  list(@Query(zod(insurerQuerySchema)) query: InsurerQuery): Promise<PaginatedResult<Insurer>> {
    return this.insurers.list(query);
  }

  @Get(':id')
  @RequirePermissions('insurers:read')
  get(@Param('id', zod(idSchema)) id: string): Promise<Insurer> {
    return this.insurers.get(id);
  }

  @Post()
  @RequirePermissions('insurers:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createInsurerSchema)) input: CreateInsurerInput,
  ): Promise<Insurer> {
    return this.insurers.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('insurers:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateInsurerSchema)) input: UpdateInsurerInput,
  ): Promise<Insurer> {
    return this.insurers.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('insurers:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(entityStatusUpdateSchema)) input: EntityStatusUpdate,
  ): Promise<Insurer> {
    return this.insurers.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('insurers:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.insurers.remove(actor, id);
  }
}
