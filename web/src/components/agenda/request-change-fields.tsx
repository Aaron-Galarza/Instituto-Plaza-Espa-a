'use client';

import type { CreateChangeRequestInput, ScheduleOccurrence } from '@plaza/shared';
import { Field, Select, Textarea } from '@/components/ui';
import { dateLabel, timeRange } from '@/lib/format';
import { JourneyBuilder, type JourneyDraft, type JourneyReference } from './journey-builder';

export function RequestChangeFields({ type, setType, reason, setReason, segmentId, setSegmentId, professionalId, setProfessionalId, spaceId, setSpaceId, draft, setDraft, occurrence, reference }: {
  type: CreateChangeRequestInput['type']; setType: (value: CreateChangeRequestInput['type']) => void;
  reason: string; setReason: (value: string) => void; segmentId: string; setSegmentId: (value: string) => void;
  professionalId: string; setProfessionalId: (value: string) => void; spaceId: string; setSpaceId: (value: string) => void;
  draft: JourneyDraft; setDraft: (value: JourneyDraft) => void; occurrence: ScheduleOccurrence; reference: JourneyReference;
}) {
  return (
    <>
        <Field label="Tipo de cambio">
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as CreateChangeRequestInput['type'])}
          >
            <option value="cancel_date">Cancelar esta fecha</option>
            <option value="modify_date">Modificar horario o tramos</option>
            <option value="reassign_professional">Reasignar profesional</option>
            <option value="change_space">Cambiar espacio</option>
          </Select>
        </Field>

        {type === 'modify_date' ? (
          <JourneyBuilder
            mode="date"
            draft={draft}
            onChange={setDraft}
            reference={reference}
            startDateLabel={dateLabel(occurrence.date)}
          />
        ) : null}

        {type === 'reassign_professional' || type === 'change_space' ? (
          <Field label="Tramo">
            <Select value={segmentId} onChange={(event) => setSegmentId(event.target.value)}>
              {occurrence.segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.serviceName} · {timeRange(segment.startMinute, segment.endMinute)}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {type === 'reassign_professional' ? (
          <Field label="Nuevo profesional">
            <Select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
            >
              <option value="">Seleccionar profesional…</option>
              {reference.professionals
                .filter((professional) => professional.status === 'active')
                .map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.firstName} {professional.lastName}
                  </option>
                ))}
            </Select>
          </Field>
        ) : null}

        {type === 'change_space' ? (
          <Field label="Nuevo espacio">
            <Select value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>
              <option value="">Sin espacio asignado</option>
              {reference.spaces
                .filter((space) => space.status === 'active')
                .map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} · capacidad {space.capacity}
                  </option>
                ))}
            </Select>
          </Field>
        ) : null}

        <Field
          label="Motivo"
          hint="Mínimo 5 caracteres. La persona que resuelve la solicitud verá este texto."
        >
          <Textarea
            rows={3}
            value={reason}
            maxLength={600}
            placeholder="Explicá brevemente el cambio propuesto."
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
    </>
  );
}
