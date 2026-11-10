'use client';

import type { AssignmentIssueDetail, Professional } from '@plaza/shared';
import { Button, ErrorBox, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { shortDate, timeRange } from '@/lib/format';
import { TIME_PATTERN, type ResolutionAction } from './availability-form';

export function ResolutionModal({ resolving, onClose, busy, onSubmit, resolveAction, setResolveAction, replacementId, setReplacementId, replacementOptions, rescheduleDate, setRescheduleDate, rescheduleStart, setRescheduleStart, resolveReason, setResolveReason, resolveError, setResolveError }: {
  resolving: AssignmentIssueDetail | null; onClose: () => void; busy: boolean; onSubmit: (issue: AssignmentIssueDetail) => void;
  resolveAction: ResolutionAction; setResolveAction: (value: ResolutionAction) => void; replacementId: string; setReplacementId: (value: string) => void;
  replacementOptions: Professional[]; rescheduleDate: string; setRescheduleDate: (value: string) => void; rescheduleStart: string; setRescheduleStart: (value: string) => void;
  resolveReason: string; setResolveReason: (value: string) => void; resolveError: string | null; setResolveError: (value: string | null) => void;
}) {
  return (
      <Modal
        open={Boolean(resolving)}
        onClose={onClose}
        title="Resolver afectación"
        description={
          resolving
            ? `${resolving.patientName} · ${shortDate(resolving.date)} · ${timeRange(resolving.startMinute, resolving.endMinute)}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="ink"
              onClick={() => {
                if (!resolving) return;
                if (resolveReason.trim().length < 5) {
                  setResolveError('Indicá un motivo de al menos 5 caracteres.');
                  return;
                }
                if (resolveAction === 'reassign' && !replacementId) {
                  setResolveError('Seleccioná el profesional que cubrirá la jornada.');
                  return;
                }
                if (
                  resolveAction === 'reschedule' &&
                  (!rescheduleDate || !TIME_PATTERN.test(rescheduleStart))
                ) {
                  setResolveError('Indicá una nueva fecha y hora válidas.');
                  return;
                }
                setResolveError(null);
                onSubmit(resolving);
              }}
              disabled={busy}
            >
              {busy ? 'Resolviendo…' : 'Resolver afectación'}
            </Button>
          </>
        }
      >
        <div className="stack gap-12">
          {resolveError ? <ErrorBox message={resolveError} /> : null}
          <div className="detail-list">
            <div className="detail-row">
              <dt>Profesional ausente</dt>
              <dd>{resolving?.professionalName}</dd>
            </div>
            <div className="detail-row">
              <dt>Prestaciones</dt>
              <dd>{resolving?.serviceNames.join(' · ') || '—'}</dd>
            </div>
          </div>
          <Field label="Acción">
            <Select
              value={resolveAction}
              onChange={(event) => setResolveAction(event.target.value as ResolutionAction)}
            >
              <option value="reassign" disabled={replacementOptions.length === 0}>
                Reasignar a otro profesional
              </option>
              <option value="reschedule">Reprogramar jornada</option>
              <option value="cancel_date">Cancelar la fecha afectada</option>
              <option value="dismiss">Desestimar con justificación</option>
            </Select>
          </Field>
          {resolveAction === 'reassign' ? (
            <Field
              label="Profesional de reemplazo"
              hint="Sólo se ofrecen profesionales activos. La reasignación se valida contra toda la agenda."
            >
              <Select
                value={replacementId}
                onChange={(event) => setReplacementId(event.target.value)}
              >
                <option value="">Seleccionar…</option>
                {replacementOptions.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.firstName} {professional.lastName}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {resolveAction === 'reschedule' ? (
            <div className="form-grid">
              <Field label="Nueva fecha">
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                />
              </Field>
              <Field label="Nuevo inicio de jornada">
                <Input
                  type="time"
                  value={rescheduleStart}
                  onChange={(event) => setRescheduleStart(event.target.value)}
                />
              </Field>
              <p className="small muted span-2">
                La duración y los tramos se conservan. La fecha original se cancela y la nueva
                jornada se valida contra disponibilidad, capacidad y conflictos antes de guardar.
              </p>
            </div>
          ) : null}
          <Field
            label="Motivo"
            hint="Queda registrado en la auditoría y en la resolución de la afectación."
          >
            <Textarea
              value={resolveReason}
              onChange={(event) => setResolveReason(event.target.value)}
              rows={3}
              placeholder={
                resolveAction === 'dismiss'
                  ? 'Explicá por qué la afectación no requiere cambios.'
                  : 'Detalle de la cobertura o cancelación.'
              }
            />
          </Field>
          {resolveAction === 'cancel_date' ? (
            <div className="notice" data-tone="warning">
              <span>
                Se cancelará únicamente la jornada de{' '}
                {resolving ? shortDate(resolving.date) : 'la fecha'}. La recurrencia semanal
                continúa vigente.
              </span>
            </div>
          ) : null}
        </div>
      </Modal>
  );
}
