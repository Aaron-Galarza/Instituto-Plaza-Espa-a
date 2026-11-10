import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  availabilityQuerySchema,
  createAvailabilitySchema,
  entityStatusUpdateSchema,
  idSchema,
  issueQuerySchema,
  resolveIssueSchema,
  updateAvailabilitySchema,
  type AssignmentIssueDetail,
  type CreateAvailabilityInput,
  type EntityStatusUpdate,
  type ProfessionalAvailability,
  type ResolveIssueInput,
  type SessionUser,
  type UpdateAvailabilityInput,
} from '@plaza/shared';
import type { z } from 'zod';
import { AvailabilityService } from './availability.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
type IssueQuery = z.infer<typeof issueQuerySchema>;

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  @RequirePermissions('availability:read')
  list(
    @CurrentUser() user: SessionUser,
    @Query(zod(availabilityQuerySchema)) query: AvailabilityQuery,
  ): Promise<ProfessionalAvailability[]> {
    return this.availability.list(user, query);
  }

  // Rutas estáticas antes de :id para evitar colisiones.
  @Get('issues')
  @RequirePermissions('availability:read')
  listIssues(
    @CurrentUser() user: SessionUser,
    @Query(zod(issueQuerySchema)) query: IssueQuery,
  ): Promise<AssignmentIssueDetail[]> {
    return this.availability.listIssues(user, query);
  }

  @Post('issues/:id/resolve')
  @RequirePermissions('availability:write')
  resolveIssue(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(resolveIssueSchema)) input: ResolveIssueInput,
  ): Promise<AssignmentIssueDetail> {
    return this.availability.resolveIssue(actor, id, input);
  }

  @Get('absences/:id/affected')
  @RequirePermissions('availability:read')
  getAbsenceIssues(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<AssignmentIssueDetail[]> {
    return this.availability.getAbsenceIssues(user, id);
  }

  @Get(':id')
  @RequirePermissions('availability:read')
  get(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<ProfessionalAvailability> {
    return this.availability.get(user, id);
  }

  @Post()
  @RequirePermissions('availability:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createAvailabilitySchema)) input: CreateAvailabilityInput,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.availability.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('availability:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateAvailabilitySchema)) input: UpdateAvailabilityInput,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.availability.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('availability:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(entityStatusUpdateSchema)) input: EntityStatusUpdate,
  ): Promise<{ entry: ProfessionalAvailability; issues: AssignmentIssueDetail[] }> {
    return this.availability.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('availability:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.availability.remove(actor, id);
  }
}
