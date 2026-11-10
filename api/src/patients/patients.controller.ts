import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createPatientSchema,
  idSchema,
  patientQuerySchema,
  patientStatusSchema,
  updatePatientSchema,
  type CreatePatientInput,
  type PaginatedResult,
  type Patient,
  type PatientQuery,
  type SessionUser,
  type UpdatePatientInput,
} from '@plaza/shared';
import type { z } from 'zod';
import { PatientsService } from './patients.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type PatientStatusInput = z.infer<typeof patientStatusSchema>;

@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @RequirePermissions('patients:read')
  list(
    @CurrentUser() user: SessionUser,
    @Query(zod(patientQuerySchema)) query: PatientQuery,
  ): Promise<PaginatedResult<Patient>> {
    return this.patients.list(user, query);
  }

  @Get(':id')
  @RequirePermissions('patients:read')
  get(@CurrentUser() user: SessionUser, @Param('id', zod(idSchema)) id: string): Promise<Patient> {
    return this.patients.get(user, id);
  }

  @Post()
  @RequirePermissions('patients:write')
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createPatientSchema)) input: CreatePatientInput,
  ): Promise<Patient> {
    return this.patients.create(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('patients:write')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updatePatientSchema)) input: UpdatePatientInput,
  ): Promise<Patient> {
    return this.patients.update(actor, id, input);
  }

  @Post(':id/status')
  @RequirePermissions('patients:write')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(patientStatusSchema)) input: PatientStatusInput,
  ): Promise<Patient> {
    return this.patients.setStatus(actor, id, input.status);
  }

  @Delete(':id')
  @RequirePermissions('patients:write')
  remove(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.patients.remove(actor, id);
  }
}
