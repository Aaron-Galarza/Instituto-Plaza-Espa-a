import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
  cancelScheduleRuleSchema,
  changeScheduleRuleSchema,
  changeGroupBlockSchema,
  createScheduleRuleSchema,
  dateRangeQuerySchema,
  finishScheduleRuleSchema,
  groupOccupancyQuerySchema,
  idSchema,
  ruleOccurrencesQuerySchema,
  scheduleQuerySchema,
  scheduleRuleQuerySchema,
  validateScheduleRuleSchema,
  type CancelScheduleRuleInput,
  type ChangeRuleResponse,
  type ChangeGroupBlockInput,
  type ChangeScheduleRuleInput,
  type CreateRuleResponse,
  type CreateScheduleRuleInput,
  type FinishScheduleRuleInput,
  type GroupOccupancy,
  type PaginatedResult,
  type ScheduleConflict,
  type ScheduleOccurrence,
  type ScheduleResponse,
  type ScheduleRule,
  type ScheduleRuleDetail,
  type ScheduleRuleQuery,
  type ScheduleValidationResponse,
  type SessionUser,
  type ValidateScheduleRuleInput,
} from '@plaza/shared';
import type { z } from 'zod';
import { ScheduleService } from './schedule.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
type RuleOccurrencesQuery = z.infer<typeof ruleOccurrencesQuerySchema>;
type GroupOccupancyQuery = z.infer<typeof groupOccupancyQuerySchema>;
type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Post('group-block/change-date')
  @RequirePermissions('schedule:write')
  changeGroupBlock(
    @CurrentUser() actor: SessionUser,
    @Body(zod(changeGroupBlockSchema)) input: ChangeGroupBlockInput,
  ) {
    return this.schedule.changeGroupBlock(actor, input);
  }

  @Get()
  @RequirePermissions('schedule:read')
  getSchedule(
    @CurrentUser() user: SessionUser,
    @Query(zod(scheduleQuerySchema)) query: ScheduleQueryInput,
  ): Promise<ScheduleResponse> {
    return this.schedule.getSchedule(user, query);
  }

  @Get('conflicts')
  @RequirePermissions('schedule:write')
  getConflicts(
    @Query(zod(dateRangeQuerySchema)) query: DateRangeQuery,
  ): Promise<ScheduleConflict[]> {
    return this.schedule.getConflicts(query.from, query.to);
  }

  @Get('pending-conflicts')
  @RequirePermissions('schedule:write')
  getPendingConflicts() {
    return this.schedule.getPendingConflicts();
  }

  @Get('group-occupancy')
  @RequirePermissions('schedule:read')
  getGroupOccupancy(
    @CurrentUser() user: SessionUser,
    @Query(zod(groupOccupancyQuerySchema)) query: GroupOccupancyQuery,
    @Query('groupId') groupId?: string,
  ): Promise<GroupOccupancy[]> {
    return this.schedule.getGroupOccupancy(user, query.date, groupId);
  }

  @Get('rules')
  @RequirePermissions('schedule:read')
  listRules(
    @CurrentUser() user: SessionUser,
    @Query(zod(scheduleRuleQuerySchema)) query: ScheduleRuleQuery,
  ): Promise<PaginatedResult<ScheduleRule>> {
    return this.schedule.listRules(user, query);
  }

  @Post('rules')
  @RequirePermissions('schedule:write')
  createRule(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createScheduleRuleSchema)) input: CreateScheduleRuleInput,
  ): Promise<CreateRuleResponse> {
    return this.schedule.createRule(actor, input);
  }

  @Get('rules/:id')
  @RequirePermissions('schedule:read')
  getRule(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<ScheduleRuleDetail> {
    return this.schedule.getRuleDetail(user, id);
  }

  @Get('rules/:id/occurrences')
  @RequirePermissions('schedule:read')
  getRuleOccurrences(
    @CurrentUser() user: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Query(zod(ruleOccurrencesQuerySchema)) query: RuleOccurrencesQuery,
  ): Promise<{ occurrences: ScheduleOccurrence[]; conflicts: ScheduleConflict[] }> {
    return this.schedule.getRuleOccurrences(user, id, query.from, query.to);
  }

  @Post('rules/:id/change')
  @RequirePermissions('schedule:write')
  changeRule(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(changeScheduleRuleSchema)) input: ChangeScheduleRuleInput,
  ): Promise<ChangeRuleResponse> {
    return this.schedule.changeRule(actor, id, input);
  }

  @Post('rules/:id/finish')
  @RequirePermissions('schedule:cancel')
  finishRule(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(finishScheduleRuleSchema)) input: FinishScheduleRuleInput,
  ): Promise<ScheduleRule> {
    return this.schedule.finishRule(actor, id, input.lastDate, input.reason);
  }

  @Post('rules/:id/cancel')
  @RequirePermissions('schedule:cancel')
  cancelRule(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(cancelScheduleRuleSchema)) input: CancelScheduleRuleInput,
  ): Promise<ScheduleRule> {
    return this.schedule.cancelRule(actor, id, input.reason);
  }

  @Delete('rules/:id')
  @RequirePermissions('schedule:write')
  deleteRule(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
  ): Promise<{ removed: true }> {
    return this.schedule.deleteRule(actor, id);
  }

  @Post('validate')
  @RequirePermissions('schedule:write')
  validate(
    @Body(zod(validateScheduleRuleSchema)) input: ValidateScheduleRuleInput,
  ): Promise<ScheduleValidationResponse> {
    return this.schedule.validateDraft(input);
  }
}
