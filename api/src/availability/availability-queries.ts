import {
  issueQuerySchema,
  type AssignmentIssueDetail,
  type ProfessionalAvailability,
  type SessionUser,
} from '@plaza/shared';
import type { z } from 'zod';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { decorateIssues } from './availability-issue-details';

type IssueQuery = z.infer<typeof issueQuerySchema>;

export class AvailabilityQueries {
  constructor(private readonly store: DataStore) {}
  async list(
    user: SessionUser,
    query: {
      professionalId?: string;
      kind?: 'regular' | 'absence' | 'block';
      status?: 'active' | 'inactive';
      from?: string;
      to?: string;
    },
  ): Promise<ProfessionalAvailability[]> {
    let entries = await this.store.repo('professionalAvailability').all();
    if (user.role === 'professional') {
      if (!user.professionalId) return [];
      entries = entries.filter((entry) => entry.professionalId === user.professionalId);
    } else if (query.professionalId) {
      entries = entries.filter((entry) => entry.professionalId === query.professionalId);
    }
    if (query.kind) entries = entries.filter((entry) => entry.kind === query.kind);
    if (query.status) entries = entries.filter((entry) => entry.status === query.status);
    if (query.from) {
      entries = entries.filter((entry) => !entry.effectiveTo || entry.effectiveTo >= query.from!);
    }
    if (query.to) entries = entries.filter((entry) => entry.effectiveFrom <= query.to!);
    return entries.sort(
      (a, b) =>
        a.effectiveFrom.localeCompare(b.effectiveFrom) ||
        (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0) ||
        a.startMinute - b.startMinute,
    );
  }

  async get(user: SessionUser, id: string): Promise<ProfessionalAvailability> {
    const entry = await this.store.repo('professionalAvailability').findById(id);
    if (!entry) throw AppError.notFound('Disponibilidad');
    if (
      user.role === 'professional' &&
      (!user.professionalId || entry.professionalId !== user.professionalId)
    ) {
      throw AppError.forbidden('No tenés acceso a esta disponibilidad.');
    }
    return entry;
  }

  async listIssues(user: SessionUser, query: IssueQuery): Promise<AssignmentIssueDetail[]> {
    let issues = await this.store.repo('assignmentIssues').all();
    if (user.role === 'professional') {
      if (!user.professionalId) return [];
      issues = issues.filter((issue) => issue.professionalId === user.professionalId);
    } else if (query.professionalId) {
      issues = issues.filter((issue) => issue.professionalId === query.professionalId);
    }
    if (query.status) issues = issues.filter((issue) => issue.status === query.status);
    if (query.absenceId) issues = issues.filter((issue) => issue.absenceId === query.absenceId);
    if (query.from) issues = issues.filter((issue) => issue.date >= query.from!);
    if (query.to) issues = issues.filter((issue) => issue.date <= query.to!);
    issues.sort(
      (a, b) =>
        (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
        a.date.localeCompare(b.date),
    );
    return decorateIssues(this.store, issues);
  }

  async getAbsenceIssues(user: SessionUser, absenceId: string): Promise<AssignmentIssueDetail[]> {
    return this.listIssues(user, { absenceId });
  }
}
