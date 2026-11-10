'use client';

import { WEEKDAY_LABELS } from '@plaza/shared';
import { Button, Field, Input, Select } from '@/components/ui';
import { PlusIcon } from '@/components/icons';

import {
  emptyDraft,
  type DraftSegment,
  type JourneyDraft,
  type JourneyMode,
  type JourneyReference,
} from './journey-draft';
export { emptyDraft, draftFromRule, draftToRuleInput, draftSegmentsForDate } from './journey-draft';
export type { DraftSegment, JourneyDraft, JourneyMode, JourneyReference } from './journey-draft';
import { SegmentEditor } from './segment-editor';
import { JourneyNotes } from './journey-notes';

export function JourneyBuilder({
  mode,
  draft,
  onChange,
  reference,
  startDateLabel,
  lockedWeekday,
}: {
  mode: JourneyMode;
  draft: JourneyDraft;
  onChange: (draft: JourneyDraft) => void;
  reference: JourneyReference;
  startDateLabel?: string;
  lockedWeekday?: number;
}) {
  const patch = (changes: Partial<JourneyDraft>) => onChange({ ...draft, ...changes });

  const updateSegment = (index: number, changes: Partial<DraftSegment>) => {
    patch({
      segments: draft.segments.map((segment, current) =>
        current === index ? { ...segment, ...changes } : segment,
      ),
    });
  };

  return (
    <div className="stack gap-12">
      {mode !== 'date' ? (
        <div className="form-grid">
          <Field label="Paciente *" className="span-2">
            <Select
              value={draft.patientId}
              onChange={(event) => patch({ patientId: event.target.value })}
            >
              <option value="">Seleccionar paciente…</option>
              {reference.patients
                .filter((patient) => patient.status === 'active' || patient.id === draft.patientId)
                .map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.lastName}, {patient.firstName}
                    {patient.status === 'inactive' ? ' (inactivo)' : ''}
                  </option>
                ))}
            </Select>
          </Field>

          <Field
            label="Días de la semana *"
            className="span-2"
            hint={
              lockedWeekday
                ? 'Este cambio conserva únicamente el día semanal seleccionado.'
                : 'Marcá todos los días en que se repite la jornada.'
            }
          >
            <div className="row gap-10" style={{ flexWrap: 'wrap' }}>
              {Object.entries(WEEKDAY_LABELS).map(([value, label]) => {
                const day = Number(value);
                const checked = draft.daysOfWeek.includes(day);
                return (
                  <label className="check" key={value}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={lockedWeekday !== undefined}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...draft.daysOfWeek, day].sort((a, b) => a - b)
                          : draft.daysOfWeek.filter((item) => item !== day);
                        patch({ daysOfWeek: next });
                      }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="Vigente desde *">
            <Input
              type="date"
              value={draft.effectiveFrom}
              onChange={(event) => patch({ effectiveFrom: event.target.value })}
              disabled={mode === 'future'}
            />
          </Field>
          <Field
            label="Vigente hasta"
            hint={mode === 'future' ? 'Dejalo vacío para continuar sin fecha de fin.' : undefined}
          >
            <Input
              type="date"
              value={draft.effectiveTo}
              min={draft.effectiveFrom}
              onChange={(event) => patch({ effectiveTo: event.target.value })}
            />
          </Field>
        </div>
      ) : (
        <div className="form-grid">
          <Field label="Horario de la jornada *">
            <div className="row gap-8">
              <Input
                type="time"
                value={draft.startTime}
                onChange={(event) => patch({ startTime: event.target.value })}
                aria-label="Hora de inicio de la jornada"
              />
              <span className="muted">–</span>
              <Input
                type="time"
                value={draft.endTime}
                onChange={(event) => patch({ endTime: event.target.value })}
                aria-label="Hora de fin de la jornada"
              />
            </div>
          </Field>
          <Field label="Fecha" hint="El cambio se guarda como excepción de esta fecha.">
            <Input value={startDateLabel ?? draft.effectiveFrom} readOnly aria-readonly="true" />
          </Field>
        </div>
      )}

      <div className={mode !== 'date' ? 'form-grid' : undefined}>
        <JourneyNotes mode={mode} draft={draft} onChange={patch} />
      </div>

      <hr className="hairline" />

      <div className="spread">
        <div>
          <h3 className="section-title" style={{ marginBottom: 2 }}>
            Tramos de atención
          </h3>
          <p className="tiny muted" style={{ margin: 0 }}>
            Cada tramo define prestación, modalidad, profesionales, espacio y horario.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            patch({
              segments: [
                ...draft.segments,
                {
                  ...emptyDraft(draft.effectiveFrom, reference).segments[0]!,
                  startTime: draft.startTime,
                  endTime: draft.endTime,
                },
              ],
            })
          }
        >
          <PlusIcon /> Agregar tramo
        </Button>
      </div>

      <div>
        {draft.segments.map((segment, index) => (
          <SegmentEditor
            key={segment.id ?? `segment-${index}`}
            index={index}
            segment={segment}
            draft={draft}
            reference={reference}
            canRemove={draft.segments.length > 1}
            onChange={(changes) => updateSegment(index, changes)}
            onRemove={() =>
              patch({ segments: draft.segments.filter((_, current) => current !== index) })
            }
          />
        ))}
      </div>
    </div>
  );
}
