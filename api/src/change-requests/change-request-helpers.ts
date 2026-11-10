import {
  type ChangeRequestProposal,
  type CreateChangeRequestInput,
  type ScheduleOccurrence,
  type ScheduleRule,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import { expandOccurrences } from '../scheduling/engine';
import type { SchedulingContext } from '../scheduling/scheduling.types';

export function buildProposal(
  input: CreateChangeRequestInput,
  occurrence: ScheduleOccurrence,
): ChangeRequestProposal {
  switch (input.type) {
    case 'cancel_date':
      return {
        type: 'cancel_date',
        scheduleRuleId: input.scheduleRuleId,
        date: input.date,
      };
    case 'modify_date':
      return {
        type: 'modify_date',
        scheduleRuleId: input.scheduleRuleId,
        date: input.date,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        segments: input.segments,
      };
    case 'reassign_professional': {
      if (!occurrence.segments.some((segment) => segment.id === input.segmentId)) {
        throw AppError.validation('El tramo indicado no pertenece a la jornada de esa fecha.');
      }
      return {
        type: 'reassign_professional',
        scheduleRuleId: input.scheduleRuleId,
        date: input.date,
        segmentId: input.segmentId,
        professionalId: input.professionalId,
      };
    }
    case 'change_space': {
      if (!occurrence.segments.some((segment) => segment.id === input.segmentId)) {
        throw AppError.validation('El tramo indicado no pertenece a la jornada de esa fecha.');
      }
      return {
        type: 'change_space',
        scheduleRuleId: input.scheduleRuleId,
        date: input.date,
        segmentId: input.segmentId,
        spaceId: input.spaceId ?? null,
      };
    }
  }
}

export function findOccurrence(
  ctx: SchedulingContext,
  ruleId: string,
  date: string,
): ScheduleOccurrence | undefined {
  return expandOccurrences(ctx, date, date).find(
    (occurrence) => occurrence.ruleId === ruleId && occurrence.date === date,
  );
}

export function assertRuleAccess(
  user: SessionUser,
  rule: ScheduleRule,
  ctx: SchedulingContext,
): void {
  if (user.role !== 'professional') return;
  if (!user.professionalId) {
    throw AppError.forbidden('Tu usuario no está vinculado a un profesional.');
  }
  const groupMap = new Map(ctx.groups.map((group) => [group.id, group]));
  const participates = rule.segments.some(
    (segment) =>
      segment.professionalIds.includes(user.professionalId!) ||
      (segment.groupId
        ? (groupMap.get(segment.groupId)?.professionalIds.includes(user.professionalId!) ?? false)
        : false),
  );
  if (!participates) {
    throw AppError.forbidden('Solo podés solicitar cambios de jornadas en las que participás.');
  }
}
