import { Inject, Injectable } from '@nestjs/common';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';
import { AuditService } from '../audit/audit.service';
import { ScheduleService } from '../scheduling/schedule.service';
import { AvailabilityQueries } from './availability-queries';
import { AvailabilityEntryActions } from './availability-entry-actions';
import { IssueResolution } from './issue-resolution';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(DATA_STORE) private readonly store: DataStore,
    private readonly audit: AuditService,
    private readonly schedule: ScheduleService,
  ) {}

  private get queries(): AvailabilityQueries {
    return new AvailabilityQueries(this.store);
  }
  list(...args: Parameters<AvailabilityQueries['list']>) {
    return this.queries.list(...args);
  }
  get(...args: Parameters<AvailabilityQueries['get']>) {
    return this.queries.get(...args);
  }
  listIssues(...args: Parameters<AvailabilityQueries['listIssues']>) {
    return this.queries.listIssues(...args);
  }
  getAbsenceIssues(...args: Parameters<AvailabilityQueries['getAbsenceIssues']>) {
    return this.queries.getAbsenceIssues(...args);
  }

  private get entryActions(): AvailabilityEntryActions {
    return new AvailabilityEntryActions(this.store, this.audit);
  }
  create(...args: Parameters<AvailabilityEntryActions['create']>) {
    return this.entryActions.create(...args);
  }
  update(...args: Parameters<AvailabilityEntryActions['update']>) {
    return this.entryActions.update(...args);
  }
  setStatus(...args: Parameters<AvailabilityEntryActions['setStatus']>) {
    return this.entryActions.setStatus(...args);
  }
  remove(...args: Parameters<AvailabilityEntryActions['remove']>) {
    return this.entryActions.remove(...args);
  }

  resolveIssue(...args: Parameters<IssueResolution['resolveIssue']>) {
    return new IssueResolution(this.store, this.audit, this.schedule).resolveIssue(...args);
  }
}
