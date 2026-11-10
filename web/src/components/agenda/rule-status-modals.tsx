'use client';

import { useEffect, useState } from 'react';
import { addDays, cancelScheduleRuleSchema, finishScheduleRuleSchema, type ScheduleOccurrence, type ScheduleRule } from '@plaza/shared';
import { Button, ErrorBox, Field, Input, Modal, Textarea } from '@/components/ui';
import { dateLabel } from '@/lib/format';

export function FinishRuleModal({
  open,
  rule,
  occurrence,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  rule: ScheduleRule;
  occurrence: ScheduleOccurrence;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: { lastDate: string; reason: string }) => void;
}) {
  const [lastDate, setLastDate] = useState(addDays(occurrence.date, -1));
  const [reason, setReason] = useState('');
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLastDate(addDays(occurrence.date, -1));
    setReason('');
    setIssues([]);
  }, [open, occurrence.date]);

  const submit = () => {
    const parsed = finishScheduleRuleSchema.safeParse({ lastDate, reason });
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setIssues([]);
    onSubmit(parsed.data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar recurrencia"
      description="La serie dejará de generar jornadas después de la fecha indicada."
      size="small"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Volver
          </Button>
          <Button variant="ink" onClick={submit} disabled={busy}>
            {busy ? 'Finalizando…' : 'Finalizar recurrencia'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        {error ? <ErrorBox message={error} /> : null}
        {issues.map((issue) => (
          <ErrorBox key={issue} message={issue} />
        ))}
        <Field
          label="Última fecha con atención"
          hint={`Serie vigente desde ${dateLabel(rule.effectiveFrom)}.`}
        >
          <Input
            type="date"
            value={lastDate}
            onChange={(event) => setLastDate(event.target.value)}
          />
        </Field>
        <Field label="Motivo">
          <Textarea
            rows={3}
            value={reason}
            maxLength={400}
            placeholder="Explicá por qué finaliza la recurrencia."
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function CancelRuleModal({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setReason('');
      setIssues([]);
    }
  }, [open]);

  const submit = () => {
    const parsed = cancelScheduleRuleSchema.safeParse({ reason });
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setIssues([]);
    onSubmit(parsed.data.reason);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancelar recurrencia"
      description="Se cancelan todas las jornadas futuras de la serie. Las jornadas pasadas conservan su registro."
      size="small"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Volver
          </Button>
          <Button variant="ink" onClick={submit} disabled={busy}>
            {busy ? 'Cancelando…' : 'Cancelar recurrencia'}
          </Button>
        </>
      }
    >
      <div className="stack gap-12">
        {error ? <ErrorBox message={error} /> : null}
        {issues.map((issue) => (
          <ErrorBox key={issue} message={issue} />
        ))}
        <Field label="Motivo">
          <Textarea
            rows={3}
            value={reason}
            maxLength={400}
            placeholder="Explicá el motivo de la cancelación."
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
