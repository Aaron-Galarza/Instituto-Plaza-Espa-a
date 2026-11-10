import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createScheduleExceptionSchema,
  idSchema,
  scheduleExceptionsQuerySchema,
  updateScheduleExceptionSchema,
  type CreateScheduleExceptionInput,
  type ScheduleConflict,
  type ScheduleException,
  type SessionUser,
  type UpdateScheduleExceptionInput,
} from '@plaza/shared';
import type { z } from 'zod';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';
import { ScheduleService } from './schedule.service';

type ExceptionsQuery = z.infer<typeof scheduleExceptionsQuerySchema>;

@Controller('schedule/exceptions')
export class ScheduleExceptionsController {
  constructor(private readonly schedule: ScheduleService) {}
  @Get()
  @RequirePermissions('schedule:read')
  listExceptions(
    @CurrentUser() user: SessionUser,
    @Query(zod(scheduleExceptionsQuerySchema)) query: ExceptionsQuery,
  ): Promise<ScheduleException[]> {
    return this.schedule.listExceptions(user, query.scheduleRuleId, query.from, query.to);
  }

  @Post()
  @RequirePermissions('schedule:write')
  createException(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createScheduleExceptionSchema)) input: CreateScheduleExceptionInput,
  ): Promise<{ exception: ScheduleException; warnings: ScheduleConflict[] }> {
    return this.schedule.createException(actor, input);
  }

  @Patch(':id')
  @RequirePermissions('schedule:write')
  updateException(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateScheduleExceptionSchema)) input: UpdateScheduleExceptionInput,
  ): Promise<{ exception: ScheduleException; warnings: ScheduleConflict[] }> {
    return this.schedule.updateException(actor, id, input);
  }

  @Delete(':id')
  @RequirePermissions('schedule:write')
  removeException(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.schedule.removeException(actor, id);
  }
}
