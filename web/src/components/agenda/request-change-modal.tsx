'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createChangeRequestSchema, isoWeekday, minutesToTime, type ChangeRequest, type CreateChangeRequestInput, type ScheduleOccurrence } from '@plaza/shared';
import { Button, ErrorBox, Modal } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { conflictsFromError } from '@/lib/conflicts';
import { useToast } from '@/lib/toast';
import { dateLabel } from '@/lib/format';
import { draftToRuleInput, type JourneyDraft, type JourneyReference } from './journey-builder';
import { RequestChangeFields } from './request-change-fields';

export function RequestChangeModal({
  open,
  occurrence,
  reference,
  onClose,
  onCreated,
}: {
  open: boolean;
  occurrence: ScheduleOccurrence;
  reference: JourneyReference;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { notify } = useToast();
  const [type, setType] = useState<CreateChangeRequestInput['type']>('cancel_date');
  const [reason, setReason] = useState('');
  const [segmentId, setSegmentId] = useState(occurrence.segments[0]?.id ?? '');
  const [professionalId, setProfessionalId] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [draft, setDraft] = useState<JourneyDraft>(() => draftFromOccurrence(occurrence));
  const [issues, setIssues] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType('cancel_date');
    setReason('');
    setSegmentId(occurrence.segments[0]?.id ?? '');
    setProfessionalId('');
    setSpaceId('');
    setDraft(draftFromOccurrence(occurrence));
    setIssues([]);
    setServerError(null);
  }, [open, occurrence.key]);

  const mutation = useMutation({
    mutationFn: (body: CreateChangeRequestInput) =>
      api<ChangeRequest>('/change-requests', { method: 'POST', body }),
    onSuccess: () => {
      notify('Solicitud enviada. Queda pendiente de resolución.');
      onCreated();
    },
    onError: (error) => {
      setServerError(errorMessage(error));
      const conflicts = conflictsFromError(error);
      if (conflicts.length > 0) {
        setIssues(conflicts.map((conflict) => conflict.message));
      }
    },
  });

  const submit = () => {
    setServerError(null);
    let proposal: Record<string, unknown>;
    if (type === 'cancel_date') {
      proposal = { type, scheduleRuleId: occurrence.ruleId, date: occurrence.date };
    } else if (type === 'modify_date') {
      const payload = draftToRuleInput(draft);
      proposal = {
        type,
        scheduleRuleId: occurrence.ruleId,
        date: occurrence.date,
        startMinute: payload.startMinute,
        endMinute: payload.endMinute,
        segments: payload.segments,
      };
    } else if (type === 'reassign_professional') {
      proposal = {
        type,
        scheduleRuleId: occurrence.ruleId,
        date: occurrence.date,
        segmentId,
        professionalId,
      };
    } else {
      proposal = {
        type,
        scheduleRuleId: occurrence.ruleId,
        date: occurrence.date,
        segmentId,
        spaceId: spaceId || null,
      };
    }
    const parsed = createChangeRequestSchema.safeParse({ ...proposal, reason });
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setIssues([]);
    mutation.mutate(parsed.data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Solicitar cambio"
      description={`${occurrence.patientName} · ${dateLabel(occurrence.date)}. La solicitud aplica solo a esta fecha.`}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        {serverError ? <ErrorBox message={serverError} /> : null}
        {issues.length > 0 ? (
          <div className="error-box" role="alert">
            <ul className="plain-list">
              {issues.map((issue, index) => (
                <li key={`${issue}-${index}`}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <RequestChangeFields type={type} setType={setType} reason={reason} setReason={setReason}
          segmentId={segmentId} setSegmentId={setSegmentId} professionalId={professionalId}
          setProfessionalId={setProfessionalId} spaceId={spaceId} setSpaceId={setSpaceId}
          draft={draft} setDraft={setDraft} occurrence={occurrence} reference={reference} />
      </div>
    </Modal>
  );
}

function draftFromOccurrence(occurrence: ScheduleOccurrence): JourneyDraft {
  return {
    patientId: occurrence.patientId,
    daysOfWeek: [isoWeekday(occurrence.date)],
    effectiveFrom: occurrence.date,
    effectiveTo: '',
    startTime: minutesToTime(occurrence.startMinute),
    endTime: minutesToTime(occurrence.endMinute),
    notes: '',
    segments: occurrence.segments.map((segment) => ({
      id: segment.id,
      serviceId: segment.serviceId,
      professionalIds: [...segment.professionalIds],
      groupId: segment.groupId ?? '',
      spaceId: segment.spaceId ?? '',
      startTime: minutesToTime(segment.startMinute),
      endTime: minutesToTime(segment.endMinute),
      modality: segment.modality as JourneyDraft['segments'][number]['modality'],
    })),
  };
}
