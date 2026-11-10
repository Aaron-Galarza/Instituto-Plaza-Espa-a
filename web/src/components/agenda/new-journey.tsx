'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createScheduleRuleSchema,
  type CreateRuleResponse,
  type ScheduleValidationResponse,
} from '@plaza/shared';
import { Button, Modal } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { conflictsFromError } from '@/lib/conflicts';
import { useToast } from '@/lib/toast';
import { dateLabel } from '@/lib/format';
import {
  JourneyBuilder,
  draftToRuleInput,
  emptyDraft,
  type JourneyDraft,
  type JourneyReference,
} from './journey-builder';
import { JourneyFeedback, type JourneyIssue } from './journey-feedback';

export function NewJourneyModal({
  open,
  onClose,
  date,
  reference,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  reference: JourneyReference;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [draft, setDraft] = useState<JourneyDraft>(() => emptyDraft(date, reference));
  const [issues, setIssues] = useState<JourneyIssue[]>([]);
  const [validation, setValidation] = useState<ScheduleValidationResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyDraft(date, reference));
    setIssues([]);
    setValidation(null);
    setServerError(null);
    // La referencia cambia con baja frecuencia; reiniciamos al abrir.
  }, [open, date]);

  const payload = useMemo(() => draftToRuleInput(draft), [draft]);
  const parsed = useMemo(() => createScheduleRuleSchema.safeParse(payload), [payload]);
  const clientIssues: JourneyIssue[] = parsed.success
    ? []
    : parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

  const create = useMutation({
    mutationFn: (body: ReturnType<typeof draftToRuleInput>) =>
      api<CreateRuleResponse>('/schedule/rules', { method: 'POST', body }),
    onSuccess: (result) => {
      notify(
        result.warnings.length > 0
          ? `Jornada creada con ${result.warnings.length} advertencia${result.warnings.length === 1 ? '' : 's'}.`
          : 'Jornada creada.',
      );
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['rules'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
      onClose();
    },
    onError: (error) => {
      setServerError(errorMessage(error));
      const conflicts = conflictsFromError(error);
      if (conflicts.length > 0) {
        setIssues(
          conflicts.map((conflict) => ({
            path: conflict.date,
            message: conflict.message,
          })),
        );
      }
    },
  });

  const validate = useMutation({
    mutationFn: (body: ReturnType<typeof draftToRuleInput>) =>
      api<ScheduleValidationResponse>('/schedule/validate', {
        method: 'POST',
        body: { rule: body },
      }),
    onSuccess: (result) => {
      setValidation(result);
      setIssues([
        ...result.errors.map((conflict) => ({
          path: conflict.date,
          message: conflict.message,
        })),
        ...result.warnings.map((conflict) => ({
          path: conflict.date,
          message: conflict.message,
        })),
      ]);
      if (result.valid && result.warnings.length === 0) {
        notify('La agenda no presenta conflictos para esta jornada.');
      }
    },
    onError: (error) => {
      setServerError(errorMessage(error));
    },
  });

  const onSubmit = () => {
    setServerError(null);
    setValidation(null);
    if (!parsed.success) {
      setIssues(clientIssues);
      return;
    }
    setIssues([]);
    create.mutate(parsed.data);
  };

  const onVerify = () => {
    setServerError(null);
    setValidation(null);
    if (!parsed.success) {
      setIssues(clientIssues);
      return;
    }
    setIssues([]);
    validate.mutate(parsed.data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva jornada"
      description={`Alta de recurrencia semanal · ${dateLabel(date)}`}
      size="wide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={onVerify} disabled={create.isPending || validate.isPending}>
            {validate.isPending ? 'Verificando…' : 'Verificar agenda'}
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear jornada'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        <JourneyFeedback
          serverError={serverError}
          clientIssues={clientIssues}
          validation={validation}
          issues={issues}
        />

        <JourneyBuilder mode="create" draft={draft} onChange={setDraft} reference={reference} />
      </div>
    </Modal>
  );
}
