'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CHANGE_REQUEST_TYPE_LABELS, adjustChangeRequestSchema, minutesToTime, type ChangeRequest, type ScheduleRuleDetail } from '@plaza/shared';
import { Button, ErrorBox, Field, Modal, Select, Textarea } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { shortDate } from '@/lib/format';
import { JourneyBuilder, draftFromRule, draftToRuleInput, type JourneyDraft, type JourneyReference } from '@/components/agenda/journey-builder';

export function AdjustRequestModal({
  request,
  rule,
  reference,
  onClose,
  onSaved,
}: {
  request: ChangeRequest;
  rule: ScheduleRuleDetail;
  reference: JourneyReference;
  onClose: () => void;
  onSaved: (updated: ChangeRequest) => void;
}) {
  const proposal = request.proposal;
  const [reason, setReason] = useState(request.reason);
  const [professionalId, setProfessionalId] = useState(
    proposal.type === 'reassign_professional' ? proposal.professionalId : '',
  );
  const [spaceId, setSpaceId] = useState(
    proposal.type === 'change_space' ? (proposal.spaceId ?? '') : '',
  );
  const [draft, setDraft] = useState<JourneyDraft>(() => {
    const initial = draftFromRule(rule.rule, proposal.date, 'date', reference);
    if (proposal.type !== 'modify_date') return initial;
    return {
      ...initial,
      startTime: minutesToTime(proposal.startMinute),
      endTime: minutesToTime(proposal.endMinute),
      segments: proposal.segments.map((segment) => ({
        id: segment.id,
        serviceId: segment.serviceId,
        professionalIds: [...segment.professionalIds],
        groupId: segment.groupId ?? '',
        spaceId: segment.spaceId ?? '',
        startTime: minutesToTime(segment.startMinute),
        endTime: minutesToTime(segment.endMinute),
        modality: segment.modality,
      })),
    };
  });
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api<ChangeRequest>(`/change-requests/${request.id}`, { method: 'PATCH', body }),
    onSuccess: onSaved,
    onError: (cause) => setError(errorMessage(cause)),
  });
  const submit = () => {
    setError(null);
    const base = {
      scheduleRuleId: request.resourceId,
      date: proposal.date,
      reason,
      expectedVersion: request.version,
    };
    const body =
      proposal.type === 'modify_date'
        ? (() => {
            const values = draftToRuleInput(draft);
            return {
              ...base,
              type: 'modify_date' as const,
              startMinute: values.startMinute,
              endMinute: values.endMinute,
              segments: values.segments,
            };
          })()
        : proposal.type === 'reassign_professional'
          ? {
              ...base,
              type: 'reassign_professional' as const,
              segmentId: proposal.segmentId,
              professionalId,
            }
          : proposal.type === 'change_space'
            ? {
                ...base,
                type: 'change_space' as const,
                segmentId: proposal.segmentId,
                spaceId: spaceId || null,
              }
            : { ...base, type: 'cancel_date' as const };
    const parsed = adjustChangeRequestSchema.safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues.map((item) => item.message).join(' · '));
      return;
    }
    mutation.mutate(parsed.data);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Ajustar propuesta"
      description={`${CHANGE_REQUEST_TYPE_LABELS[request.type]} · ${shortDate(proposal.date)}`}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Volver
          </Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar propuesta'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        <p className="small muted" style={{ margin: 0 }}>
          La solicitud seguirá pendiente después de guardar. Revisá la propuesta y aprobala cuando
          sea viable.
        </p>
        {error ? <ErrorBox message={error} /> : null}
        {proposal.type === 'modify_date' ? (
          <JourneyBuilder
            mode="date"
            draft={draft}
            onChange={setDraft}
            reference={reference}
            startDateLabel={shortDate(proposal.date)}
          />
        ) : null}
        {proposal.type === 'reassign_professional' ? (
          <Field label="Nuevo profesional">
            <Select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
            >
              <option value="">Seleccionar…</option>
              {reference.professionals
                .filter((item) => item.status === 'active' || item.id === professionalId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.firstName} {item.lastName}
                  </option>
                ))}
            </Select>
          </Field>
        ) : null}
        {proposal.type === 'change_space' ? (
          <Field label="Nuevo espacio">
            <Select value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>
              <option value="">Sin espacio</option>
              {reference.spaces
                .filter((item) => item.status === 'active' || item.id === spaceId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Motivo de la solicitud">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
        </Field>
      </div>
    </Modal>
  );
}
