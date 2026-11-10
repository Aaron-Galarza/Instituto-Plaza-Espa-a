import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createProfessionalSchema,
  idSchema,
  professionalQuerySchema,
  professionalStatusSchema,
  updateProfessionalSchema,
  type CreateProfessionalInput,
  type PaginatedResult,
  type Professional,
  type ProfessionalQuery,
  type SessionUser,
  type UpdateProfessionalInput,
} from '@plaza/shared';
import type { z } from 'zod';
import { ProfessionalsService } from './professionals.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type StatusInput = z.infer<typeof professionalStatusSchema>;

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Get()
  @RequirePermissions('professionals:read')
  list(
    @CurrentUser() user: SessionUser,
    @Query(zod(professionalQuerySchema)) query: ProfessionalQuery,
  ): Promise<PaginatedResult<Professional>> {
    return this.professionals.list(user, query);
  }

  @Get(':id')
  @RequirePermissions('professionals:read')
  get(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<Professional> {
    return this.professionals.get(user, id);
  }

  @Post()
  @RequirePermissions('professionals:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createProfessionalSchema)) input: CreateProfessionalInput,
  ): Promise<Professional> {
    return this.professionals.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('professionals:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateProfessionalSchema)) input: UpdateProfessionalInput,
  ): Promise<Professional> {
    return this.professionals.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('professionals:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(professionalStatusSchema)) input: StatusInput,
  ): Promise<Professional> {
    return this.professionals.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('professionals:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.professionals.remove(actor, id);
  }
}
