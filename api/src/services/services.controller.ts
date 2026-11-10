import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createServiceSchema,
  entityStatusUpdateSchema,
  idSchema,
  serviceQuerySchema,
  updateServiceSchema,
  type CreateServiceInput,
  type EntityStatusUpdate,
  type PaginatedResult,
  type Service,
  type ServiceQuery,
  type SessionUser,
  type UpdateServiceInput,
} from '@plaza/shared';
import { ServicesService } from './services.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @RequirePermissions('services:read')
  list(@Query(zod(serviceQuerySchema)) query: ServiceQuery): Promise<PaginatedResult<Service>> {
    return this.services.list(query);
  }

  @Get(':id')
  @RequirePermissions('services:read')
  get(@Param('id', zod(idSchema)) id: string): Promise<Service> {
    return this.services.get(id);
  }

  @Post()
  @RequirePermissions('services:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createServiceSchema)) input: CreateServiceInput,
  ): Promise<Service> {
    return this.services.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('services:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateServiceSchema)) input: UpdateServiceInput,
  ): Promise<Service> {
    return this.services.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('services:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(entityStatusUpdateSchema)) input: EntityStatusUpdate,
  ): Promise<Service> {
    return this.services.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('services:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.services.remove(actor, id);
  }
}
