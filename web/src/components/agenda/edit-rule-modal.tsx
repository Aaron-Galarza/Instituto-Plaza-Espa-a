'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeScheduleRuleSchema, isoWeekday, WEEKDAY_SHORT_LABELS, type ScheduleOccurrence, type ScheduleRule } from '@plaza/shared';
import { Button, ErrorBox, LoadingBlock, Modal } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { conflictsFromError } from '@/lib/conflicts';
import { useToast } from '@/lib/toast';
import { dateLabel } from '@/lib/format';
import { JourneyBuilder, draftFromRule, draftToRuleInput, type JourneyDraft, type JourneyReference } from './journey-builder';

export function EditRuleModal({
  open,
  mode,
  occurrence,
  rule,
  reference,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: 'date' | 'weekday' | 'future';
  occurrence: ScheduleOccurrence;
  rule: ScheduleRule | null;
  reference: JourneyReference;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(
      rule
        ? {
            ...draftFromRule(rule, occurrence.date, mode === 'date' ? 'date' : 'future', reference),
            ...(mode === 'weekday' ? { daysOfWeek: [isoWeekday(occurrence.date)] } : {}),
          }
        : null,
    );
    setIssues([]);
    setServerError(null);
  }, [open, rule?.id, mode, occurrence.date]);

  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api(`/schedule/rules/${occurrence.ruleId}/change`, { method: 'POST', body }),
    onSuccess: () => {
      notify(
        mode === 'date'
          ? 'Se guardó el cambio para esta fecha.'
          : mode === 'weekday'
            ? 'Se cambiaron las jornadas futuras de este día semanal.'
            : 'Se creó una nueva versión de la recurrencia.',
      );
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['rules'] });
      void queryClient.invalidateQueries({ queryKey: ['rule'] });
      void queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      onSaved();
    },
    onError: (error) => {
      setServerError(errorMessage(error));
      setIssues(conflictsFromError(error).map((conflict) => conflict.message));
    },
  });

  if (!open) return null;

  if (!draft) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Editar recurrencia"
        footer={
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <LoadingBlock rows={3} />
      </Modal>
    );
  }

  const submit = () => {
    setServerError(null);
    if (!rule) {
      setServerError('No se pudo cargar la recurrencia.');
      return;
    }
    const payload = draftToRuleInput(draft);
    const base = {
      startMinute: payload.startMinute,
      endMinute: payload.endMinute,
      segments: payload.segments,
      notes: payload.notes ?? null,
    };
    const body =
      mode === 'date'
        ? {
            scope: 'date' as const,
            date: occurrence.date,
            expectedVersion: rule.version,
            changes: base,
          }
        : {
            scope: mode === 'weekday' ? ('weekday_future' as const) : ('future' as const),
            date: occurrence.date,
            expectedVersion: rule.version,
            changes: {
              ...base,
              patientId: payload.patientId,
              daysOfWeek: payload.daysOfWeek,
              effectiveFrom: occurrence.date,
              effectiveTo: payload.effectiveTo ?? null,
            },
          };
    const parsed = changeScheduleRuleSchema.safeParse(body);
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setIssues([]);
    mutation.mutate(parsed.data);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        mode === 'date'
          ? 'Modificar solo esta fecha'
          : mode === 'weekday'
            ? 'Cambiar este día semanal desde ahora'
            : 'Cambiar toda la recurrencia desde ahora'
      }
      description={
        mode === 'date'
          ? `${occurrence.patientName} · ${dateLabel(occurrence.date)}`
          : mode === 'weekday'
            ? `Se cambiarán solo los ${WEEKDAY_SHORT_LABELS[isoWeekday(occurrence.date)]} desde ${dateLabel(occurrence.date)}; los otros días conservarán su horario.`
            : `Se cambiarán todos los días semanales desde ${dateLabel(occurrence.date)}.`
      }
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar cambio'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        {serverError ? <ErrorBox message={serverError} /> : null}
        {issues.length > 0 ? (
          <div className="error-box" role="alert">
            <ul className="plain-list">
              {issues.slice(0, 8).map((issue, index) => (
                <li key={`${issue}-${index}`}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <JourneyBuilder
          mode={mode === 'weekday' ? 'future' : mode}
          draft={draft}
          onChange={setDraft}
          reference={reference}
          startDateLabel={dateLabel(occurrence.date)}
          lockedWeekday={mode === 'weekday' ? isoWeekday(occurrence.date) : undefined}
        />
      </div>
    </Modal>
  );
}
