'use client';

import { Field, Textarea } from '@/components/ui';
import type { JourneyDraft, JourneyMode } from './journey-draft';

export function JourneyNotes({ mode, draft, onChange }: {
  mode: JourneyMode;
  draft: JourneyDraft;
  onChange: (changes: Partial<JourneyDraft>) => void;
}) {
  const recurring = mode !== 'date';
  return (
    <Field label={recurring ? 'Notas de la recurrencia' : 'Notas de la fecha'} className={recurring ? 'span-2' : undefined}>
      <Textarea
        value={draft.notes}
        rows={2}
        maxLength={500}
        placeholder={recurring
          ? 'Indicaciones operativas que se repiten con la jornada.'
          : 'Motivo o indicación para esta fecha en particular.'}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
    </Field>
  );
}
