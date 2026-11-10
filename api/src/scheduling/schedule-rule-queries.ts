import {
  addDays,
  daysBetween,
  paginate,
  todayInInstitutionTz,
  type PaginatedResult,
  type ScheduleConflict,
  type ScheduleOccurrence,
  type ScheduleRule,
  type ScheduleRuleDetail,
  type ScheduleRuleQuery,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { matchesSearch, personName } from '../common/search';
import type { DataStore } from '../database/data-store';
import { attachConflictCounts, buildScheduleView, expandOccurrences } from './engine';
import { loadSchedulingContext } from './context';
import type { SchedulingContext } from './scheduling.types';

const MAX_VIEW_DAYS = 62;
const WARNING_HORIZON_DAYS = 28;
interface ValidationWindow {
  from: string;
  to: string;
}

export class ScheduleRuleQueries {
  constructor(private readonly store: DataStore) {}
  async listRules(
    user: SessionUser,
    query: ScheduleRuleQuery,
  ): Promise<PaginatedResult<ScheduleRule>> {
    const ctx = await loadSchedulingContext(this.store);
    const groups = new Map(ctx.groups.map((group) => [group.id, group]));
    let rules = ctx.rules;

    if (user.role === 'professional') {
      if (!user.professionalId) rules = [];
      else {
        const professionalId = user.professionalId;
        rules = rules.filter((rule) =>
          rule.segments.some(
            (segment) =>
              segment.professionalIds.includes(professionalId) ||
              (segment.groupId
                ? (groups.get(segment.groupId)?.professionalIds.includes(professionalId) ?? false)
                : false),
          ),
        );
      }
    }
    if (query.patientId) rules = rules.filter((rule) => rule.patientId === query.patientId);
    if (query.groupId) {
      rules = rules.filter((rule) =>
        rule.segments.some((segment) => segment.groupId === query.groupId),
      );
    }
    if (query.professionalId) {
      rules = rules.filter((rule) =>
        rule.segments.some((segment) => segment.professionalIds.includes(query.professionalId!)),
      );
    }
    if (query.status) rules = rules.filter((rule) => rule.status === query.status);
    if (query.from) {
      rules = rules.filter((rule) => !rule.effectiveTo || rule.effectiveTo >= query.from!);
    }
    if (query.to) rules = rules.filter((rule) => rule.effectiveFrom <= query.to!);
    if (query.search) {
      rules = rules.filter((rule) => {
        const patient = ctx.patients.find((item) => item.id === rule.patientId);
        const professionalNames = rule.segments.flatMap((segment) =>
          segment.professionalIds
            .map((id) => ctx.professionals.find((item) => item.id === id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => `${item.firstName} ${item.lastName}`),
        );
        return matchesSearch(
          [patient ? `${patient.firstName} ${patient.lastName}` : '', ...professionalNames].join(
            ' ',
          ),
          query.search,
        );
      });
    }

    rules = [...rules].sort(
      (a, b) =>
        b.effectiveFrom.localeCompare(a.effectiveFrom) ||
        a.patientId.localeCompare(b.patientId) ||
        a.createdAt.localeCompare(b.createdAt),
    );
    return paginate(rules, query.page, query.pageSize);
  }

  async getRuleDetail(user: SessionUser, id: string): Promise<ScheduleRuleDetail> {
    const ctx = await loadSchedulingContext(this.store);
    const rule = ctx.rules.find((item) => item.id === id);
    if (!rule) throw AppError.notFound('Jornada');
    this.assertRuleAccess(user, rule, ctx);

    const series = ctx.rules
      .filter((item) => item.seriesId === rule.seriesId)
      .sort((a, b) => a.version - b.version);
    const ruleIds = new Set(series.map((item) => item.id));
    const exceptions = ctx.exceptions
      .filter((exception) => ruleIds.has(exception.scheduleRuleId))
      .sort((a, b) => a.date.localeCompare(b.date));

    const window = this.warningWindow(rule);
    const warnings = window
      ? buildScheduleView(ctx, window.from, window.to).conflicts.filter(
          (conflict) => conflict.severity === 'warning' && conflict.ruleIds.includes(rule.id),
        )
      : [];
    const patient = ctx.patients.find((item) => item.id === rule.patientId);
    return {
      rule,
      series,
      exceptions,
      patientName: patient ? personName(patient) : 'Paciente inexistente',
      warnings,
    };
  }

  async getRuleOccurrences(
    user: SessionUser,
    id: string,
    from: string,
    to: string,
  ): Promise<{ occurrences: ScheduleOccurrence[]; conflicts: ScheduleConflict[] }> {
    if (daysBetween(from, to) > MAX_VIEW_DAYS) {
      throw AppError.validation(`El rango máximo de consulta es de ${MAX_VIEW_DAYS} días.`);
    }
    const ctx = await loadSchedulingContext(this.store);
    const rule = ctx.rules.find((item) => item.id === id);
    if (!rule) throw AppError.notFound('Jornada');
    this.assertRuleAccess(user, rule, ctx);
    const occurrences = expandOccurrences(ctx, from, to).filter(
      (occurrence) => occurrence.ruleId === id,
    );
    const conflicts = buildScheduleView(ctx, from, to).conflicts.filter(
      (conflict) =>
        conflict.ruleIds.includes(id) &&
        conflict.occurrenceKeys.some((key) => occurrences.some((item) => item.key === key)),
    );
    attachConflictCounts(occurrences, conflicts);
    return { occurrences, conflicts };
  }

  private warningWindow(rule: ScheduleRule): ValidationWindow | null {
    const today = todayInInstitutionTz();
    const start = rule.effectiveFrom > today ? rule.effectiveFrom : today;
    const horizon = addDays(start, WARNING_HORIZON_DAYS - 1);
    const end = rule.effectiveTo && rule.effectiveTo < horizon ? rule.effectiveTo : horizon;
    if (start > end) return null;
    return { from: start, to: end };
  }

  private assertRuleAccess(user: SessionUser, rule: ScheduleRule, ctx: SchedulingContext): void {
    if (user.role !== 'professional') return;
    if (!user.professionalId)
      throw AppError.forbidden('Tu usuario no está vinculado a un profesional.');
    const groupMap = new Map(ctx.groups.map((group) => [group.id, group]));
    const participates = rule.segments.some(
      (segment) =>
        segment.professionalIds.includes(user.professionalId!) ||
        (segment.groupId
          ? (groupMap.get(segment.groupId)?.professionalIds.includes(user.professionalId!) ?? false)
          : false),
    );
    if (!participates) throw AppError.forbidden('No tenés acceso a esta jornada.');
  }
}
