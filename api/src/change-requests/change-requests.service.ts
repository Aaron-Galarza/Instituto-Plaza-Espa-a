import { Inject, Injectable } from '@nestjs/common';
import { CHANGE_REQUEST_SCOPE_NOTE } from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AuditService } from '../audit/audit.service';
import { ScheduleService } from '../scheduling/schedule.service';
import { ChangeRequestQueries } from './change-request-queries';
import { ChangeRequestActions } from './change-request-actions';
import { ChangeRequestResolution } from './change-request-resolution';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly schedule: ScheduleService,
  ) {}

  private get queries(): ChangeRequestQueries {
    return new ChangeRequestQueries(this.store);
  }
  list(...args: Parameters<ChangeRequestQueries['list']>) {
    return this.queries.list(...args);
  }
  get(...args: Parameters<ChangeRequestQueries['get']>) {
    return this.queries.get(...args);
  }

  private get actions(): ChangeRequestActions {
    return new ChangeRequestActions(this.store, this.audit);
  }
  private get resolution(): ChangeRequestResolution {
    return new ChangeRequestResolution(this.store, this.audit, this.schedule);
  }
  create(...args: Parameters<ChangeRequestActions['create']>) {
    return this.actions.create(...args);
  }
  adjust(...args: Parameters<ChangeRequestActions['adjust']>) {
    return this.actions.adjust(...args);
  }
  approve(...args: Parameters<ChangeRequestResolution['approve']>) {
    return this.resolution.approve(...args);
  }
  reject(...args: Parameters<ChangeRequestResolution['reject']>) {
    return this.resolution.reject(...args);
  }
  cancel(...args: Parameters<ChangeRequestResolution['cancel']>) {
    return this.resolution.cancel(...args);
  }

  scopeNote(): string {
    return CHANGE_REQUEST_SCOPE_NOTE;
  }

  // -------------------------------------------------------------------------
}
