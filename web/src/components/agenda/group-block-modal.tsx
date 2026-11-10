'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { changeGroupBlockSchema, minutesToTime, timeToMinutes, type ScheduleOccurrence, type ScheduleResponse } from '@plaza/shared';
import { Button, ErrorBox, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { conflictsFromError } from '@/lib/conflicts';
import { dateLabel } from '@/lib/format';
import type { JourneyReference } from './journey-builder';

export function GroupBlockModal({
  occurrence,
  segmentId,
  reference,
  onClose,
  onSaved,
}: {
  occurrence: ScheduleOccurrence;
  segmentId: string;
  reference: JourneyReference;
  onClose: () => void;
  onSaved: () => void;
}) {
  const segment = occurrence.segments.find((item) => item.id === segmentId)!;
  const group = reference.groups.find((item) => item.id === segment.groupId);
  const [startTime, setStartTime] = useState(minutesToTime(segment.startMinute));
  const [endTime, setEndTime] = useState(minutesToTime(segment.endMinute));
  const [professionalIds, setProfessionalIds] = useState([...segment.professionalIds]);
  const [spaceId, setSpaceId] = useState(segment.spaceId ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const participants = useQuery<ScheduleResponse>({
    queryKey: ['group-block', occurrence.date, segment.groupId],
    queryFn: () =>
      api<ScheduleResponse>(
        `/schedule?from=${occurrence.date}&to=${occurrence.date}&groupId=${segment.groupId}`,
      ),
    enabled: Boolean(segment.groupId),
  });
  const matching =
    participants.data?.occurrences.filter((item) =>
      item.segments.some(
        (part) =>
          part.groupId === segment.groupId &&
          part.startMinute === segment.startMinute &&
          part.endMinute === segment.endMinute,
      ),
    ) ?? [];
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api('/schedule/group-block/change-date', { method: 'POST', body }),
    onSuccess: onSaved,
    onError: (cause) => {
      setError(errorMessage(cause));
      setConflicts(conflictsFromError(cause).map((item) => item.message));
    },
  });
  const submit = () => {
    setError(null);
    setConflicts([]);
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      setError('Ingresá ambas horas del bloque grupal.');
      return;
    }
    if (matching.length === 0) {
      setError('No se encontraron jornadas de este bloque. Actualizá la agenda.');
      return;
    }
    const body = {
      groupId: segment.groupId,
      date: occurrence.date,
      sourceStartMinute: segment.startMinute,
      sourceEndMinute: segment.endMinute,
      startMinute: timeToMinutes(startTime),
      endMinute: timeToMinutes(endTime),
      professionalIds,
      spaceId: spaceId || null,
      expectedRuleVersions: Object.fromEntries(
        matching.map((item) => [item.ruleId, item.ruleVersion]),
      ),
      reason,
    };
    const parsed = changeGroupBlockSchema.safeParse(body);
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
      title="Modificar bloque grupal completo"
      description={`${segment.groupName ?? 'Grupo'} · ${dateLabel(occurrence.date)}`}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={mutation.isPending || participants.isLoading || participants.isError}
            onClick={submit}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar para todos'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        <p className="small muted" style={{ margin: 0 }}>
          Este cambio se aplicará a {matching.length} jornada{matching.length === 1 ? '' : 's'} del
          mismo bloque. Las demás prestaciones de cada paciente se conservarán.
        </p>
        {participants.isError ? <ErrorBox message={errorMessage(participants.error)} /> : null}
        {error ? <ErrorBox message={error} /> : null}
        {conflicts.length ? (
          <ul className="plain-list">
            {conflicts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="form-grid">
          <Field label="Hora desde">
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Field>
          <Field label="Hora hasta">
            <Input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </Field>
          <Field label="Espacio">
            <Select
              value={spaceId}
              onChange={(event) => setSpaceId(event.target.value)}
              disabled={Boolean(group?.spaceId)}
            >
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
          <Field label="Profesionales" className="span-2">
            <div className="row gap-10" style={{ flexWrap: 'wrap' }}>
              {reference.professionals
                .filter((item) => group?.professionalIds.includes(item.id))
                .map((item) => (
                  <label className="check" key={item.id}>
                    <input
                      type="checkbox"
                      checked={professionalIds.includes(item.id)}
                      onChange={(event) =>
                        setProfessionalIds(
                          event.target.checked
                            ? [...professionalIds, item.id]
                            : professionalIds.filter((id) => id !== item.id),
                        )
                      }
                    />
                    {item.firstName} {item.lastName}
                  </label>
                ))}
            </div>
          </Field>
          <Field label="Motivo del cambio" className="span-2">
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
