import {
  type ChangeRequest,
  type ScheduleRule,
  type ScheduleSegmentInput,
  type SessionUser,
} from '@plaza/shared';
import { AppError } from '../common/errors';
import type { DataStore } from '../database/data-store';
import { loadSchedulingContext } from '../scheduling/context';
import { ScheduleService } from '../scheduling/schedule.service';
import { findOccurrence } from './change-request-helpers';

export async function applyProposal(
  schedule: ScheduleService,
  tx: DataStore,
  actor: SessionUser,
  request: ChangeRequest,
  rule: ScheduleRule,
): Promise<void> {
  const proposal = request.proposal;
  const reason = `Solicitud aprobada: ${request.reason}`;

  if (proposal.type === 'cancel_date') {
    await schedule.applyCancellationTx(tx, actor, rule, proposal.date, reason, {
      skipAudit: false,
    });
    return;
  }

  if (proposal.type === 'modify_date') {
    await schedule.applyDateChangeTx(
      tx,
      actor,
      rule,
      proposal.date,
      {
        startMinute: proposal.startMinute,
        endMinute: proposal.endMinute,
        segments: proposal.segments,
        reason,
      },
      { skipAudit: false },
    );
    return;
  }

  const ctx = await loadSchedulingContext(tx);
  const occurrence = findOccurrence(ctx, rule.id, proposal.date);
  if (!occurrence || occurrence.status === 'cancelled') {
    throw AppError.conflict('La fecha ya no tiene una jornada activa para modificar.');
  }
  const target = occurrence.segments.find((segment) => segment.id === proposal.segmentId);
  if (!target) throw AppError.validation('El tramo indicado ya no existe en la jornada.');

  const segments: ScheduleSegmentInput[] = occurrence.segments.map((segment) => ({
    id: segment.id,
    serviceId: segment.serviceId,
    professionalIds:
      segment.id === proposal.segmentId && proposal.type === 'reassign_professional'
        ? [proposal.professionalId]
        : segment.professionalIds,
    groupId: segment.groupId ?? undefined,
    spaceId:
      segment.id === proposal.segmentId && proposal.type === 'change_space'
        ? (proposal.spaceId ?? null)
        : (segment.spaceId ?? undefined),
    startMinute: segment.startMinute,
    endMinute: segment.endMinute,
    modality: segment.modality as ScheduleSegmentInput['modality'],
    notes: segment.notes ?? undefined,
  }));

  await schedule.applyDateChangeTx(
    tx,
    actor,
    rule,
    proposal.date,
    {
      startMinute: occurrence.startMinute,
      endMinute: occurrence.endMinute,
      segments,
      reason,
    },
    { skipAudit: false },
  );
}
