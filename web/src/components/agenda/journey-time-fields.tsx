'use client';

import { Field, Input } from '@/components/ui';
import type { JourneyDraft, JourneyMode } from './journey-draft';

export function JourneyTimeFields({ mode, draft, onChange, startDateLabel }: {
  mode: JourneyMode;
  draft: JourneyDraft;
  onChange: (changes: Partial<JourneyDraft>) => void;
  startDateLabel?: string;
}) {
  return (
    <div className="form-grid">
      <Field label="Horario de la jornada *" hint="Debe abarcar todos los tramos. Si extendés un tramo, este horario se amplía automáticamente.">
        <div className="row gap-8">
          <Input type="time" value={draft.startTime}
            onChange={(event) => onChange({ startTime: event.target.value })}
            aria-label="Hora de inicio de la jornada" />
          <span className="muted">–</span>
          <Input type="time" value={draft.endTime}
            onChange={(event) => onChange({ endTime: event.target.value })}
            aria-label="Hora de fin de la jornada" />
        </div>
      </Field>
      {mode === 'date' ? (
        <Field label="Fecha" hint="El cambio se guarda como excepción de esta fecha.">
          <Input value={startDateLabel ?? draft.effectiveFrom} readOnly aria-readonly="true" />
        </Field>
      ) : null}
    </div>
  );
}
