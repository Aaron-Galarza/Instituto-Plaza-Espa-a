import { Inject, Injectable } from '@nestjs/common';
import {
  type ChangeGroupBlockInput,
  type ChangeScheduleRuleInput,
  type CreateRuleResponse,
  type CreateScheduleRuleInput,
  type ScheduleConflict,
  type ScheduleException,
  type ScheduleRule,
  type ScheduleValidationResponse,
  type SessionUser,
  type ValidateScheduleRuleInput,
} from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AuditService } from '../audit/audit.service';
import { ScheduleViewQueries } from './schedule-view-queries';
import { ScheduleRuleQueries } from './schedule-rule-queries';
import { ScheduleGroupQueries } from './schedule-group-queries';
import { ScheduleExceptionActions } from './schedule-exception-actions';
import { listExceptions } from './schedule-exception-queries';
import { validateDraft } from './schedule-draft-validation';
import { applyDateChange } from './schedule-date-change';
import { applyCancellation } from './schedule-date-cancellation';
import { changeGroupBlock } from './group-block-change';
import { createRuleTx } from './schedule-rule-create';
import { ScheduleRuleLifecycle } from './schedule-rule-lifecycle';
import { changeRule } from './schedule-rule-change';
import { assertCompatibleGroupSessionTx } from './group-session-validation';
import type { DateChangePatch } from './schedule-validation';

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
  ) {}

  // -------------------------------------------------------------------------
  // Consultas
  // -------------------------------------------------------------------------

  private get viewQueries(): ScheduleViewQueries {
    return new ScheduleViewQueries(this.store);
  }
  private get ruleQueries(): ScheduleRuleQueries {
    return new ScheduleRuleQueries(this.store);
  }
  private get groupQueries(): ScheduleGroupQueries {
    return new ScheduleGroupQueries(this.store);
  }

  getSchedule(...args: Parameters<ScheduleViewQueries['getSchedule']>) {
    return this.viewQueries.getSchedule(...args);
  }
  getDay(...args: Parameters<ScheduleViewQueries['getDay']>) {
    return this.viewQueries.getDay(...args);
  }
  getConflicts(...args: Parameters<ScheduleViewQueries['getConflicts']>) {
    return this.viewQueries.getConflicts(...args);
  }
  getPendingConflicts(...args: Parameters<ScheduleViewQueries['getPendingConflicts']>) {
    return this.viewQueries.getPendingConflicts(...args);
  }
  listRules(...args: Parameters<ScheduleRuleQueries['listRules']>) {
    return this.ruleQueries.listRules(...args);
  }
  getRuleDetail(...args: Parameters<ScheduleRuleQueries['getRuleDetail']>) {
    return this.ruleQueries.getRuleDetail(...args);
  }
  getRuleOccurrences(...args: Parameters<ScheduleRuleQueries['getRuleOccurrences']>) {
    return this.ruleQueries.getRuleOccurrences(...args);
  }
  getGroupOccupancy(...args: Parameters<ScheduleGroupQueries['getGroupOccupancy']>) {
    return this.groupQueries.getGroupOccupancy(...args);
  }

  async assertCompatibleGroupSessionTx(
    ...args: Parameters<typeof assertCompatibleGroupSessionTx>
  ): ReturnType<typeof assertCompatibleGroupSessionTx> {
    return assertCompatibleGroupSessionTx(...args);
  }

  changeGroupBlock(actor: SessionUser, input: ChangeGroupBlockInput) {
    return changeGroupBlock(this.store, this.audit, actor, input);
  }

  // -------------------------------------------------------------------------
  // Creación y modificación de recurrencias
  // -------------------------------------------------------------------------

  async createRule(
    actor: SessionUser,
    input: CreateScheduleRuleInput,
  ): Promise<CreateRuleResponse> {
    return this.store.transaction((tx) => this.createRuleTx(tx, actor, input));
  }

  createRuleTx(tx: DataStore, actor: SessionUser, input: CreateScheduleRuleInput) {
    return createRuleTx(this.audit, tx, actor, input);
  }

  changeRule(actor: SessionUser, id: string, input: ChangeScheduleRuleInput) {
    return changeRule(this.store, this.audit, actor, id, input);
  }

  private get lifecycle(): ScheduleRuleLifecycle {
    return new ScheduleRuleLifecycle(this.store, this.audit);
  }
  finishRule(...args: Parameters<ScheduleRuleLifecycle['finishRule']>) {
    return this.lifecycle.finishRule(...args);
  }
  cancelRule(...args: Parameters<ScheduleRuleLifecycle['cancelRule']>) {
    return this.lifecycle.cancelRule(...args);
  }
  deleteRule(...args: Parameters<ScheduleRuleLifecycle['deleteRule']>) {
    return this.lifecycle.deleteRule(...args);
  }

  // -------------------------------------------------------------------------
  // Excepciones
  // -------------------------------------------------------------------------

  listExceptions(
    user: SessionUser,
    scheduleRuleId?: string,
    from?: string,
    to?: string,
  ): Promise<ScheduleException[]> {
    return listExceptions(this.store, user, scheduleRuleId, from, to);
  }

  private get exceptionActions(): ScheduleExceptionActions {
    return new ScheduleExceptionActions(this.store, this.audit, this);
  }

  createException(...args: Parameters<ScheduleExceptionActions['createException']>) {
    return this.exceptionActions.createException(...args);
  }
  updateException(...args: Parameters<ScheduleExceptionActions['updateException']>) {
    return this.exceptionActions.updateException(...args);
  }
  removeException(...args: Parameters<ScheduleExceptionActions['removeException']>) {
    return this.exceptionActions.removeException(...args);
  }

  // -------------------------------------------------------------------------
  // Validación previa (para formularios)
  // -------------------------------------------------------------------------

  validateDraft(input: ValidateScheduleRuleInput): Promise<ScheduleValidationResponse> {
    return validateDraft(this.store, input);
  }

  // -------------------------------------------------------------------------
  // Operaciones transaccionales reutilizables
  // -------------------------------------------------------------------------

  applyDateChangeTx(
    tx: DataStore,
    actor: SessionUser,
    rule: ScheduleRule,
    date: string,
    patch: DateChangePatch,
    options: { skipAudit?: boolean } = {},
  ): Promise<{ rule: ScheduleRule; exception: ScheduleException; warnings: ScheduleConflict[] }> {
    return applyDateChange(tx, actor, rule, date, patch, options, this.audit);
  }

  applyCancellationTx(
    tx: DataStore,
    actor: SessionUser,
    rule: ScheduleRule,
    date: string,
    reason: string | null,
    options: { skipAudit?: boolean } = {},
  ): Promise<ScheduleException> {
    return applyCancellation(tx, actor, rule, date, reason, options, this.audit);
  }
}
