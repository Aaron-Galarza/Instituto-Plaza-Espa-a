import { CHANGE_REQUEST_TYPE_LABELS, type ChangeRequest } from '@plaza/shared';
import { Button, ErrorBox, Field, Modal, Textarea } from '@/components/ui';

interface Props {
  mode: 'approve' | 'reject' | null;
  current: ChangeRequest | null;
  note: string;
  error: string | null;
  conflicts: string[];
  busy: boolean;
  onClose: () => void;
  onClearError: () => void;
  onNote: (note: string) => void;
  onSubmit: () => void;
}

export function RequestResolutionModal({ mode, current, note, error, conflicts, busy,
  onClose, onClearError, onNote, onSubmit }: Props) {
  const close = () => { onClose(); onClearError(); };
  return (
      <Modal
        open={mode !== null}
        onClose={close}
        title={mode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        description={
          current
            ? `${CHANGE_REQUEST_TYPE_LABELS[current.type]} · ${current.requesterName}`
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={close}
              disabled={busy}
            >
              Volver
            </Button>
            <Button
              variant={mode === 'approve' ? 'primary' : 'ink'}
              onClick={onSubmit}
              disabled={busy}
            >
              {busy
                ? 'Resolviendo…'
                : mode === 'approve'
                  ? 'Aprobar y actualizar agenda'
                  : 'Rechazar solicitud'}
            </Button>
          </>
        }
      >
        <div className="stack gap-12">
          {error ? <ErrorBox message={error} /> : null}
          {conflicts.length ? (
            <div className="error-box" role="alert">
              <ul className="plain-list">
                {conflicts.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
              <p className="small">Cerrá esta ventana y usá «Ajustar propuesta» para corregirla.</p>
            </div>
          ) : null}
          {mode === 'approve' ? (
            <div className="notice" data-tone="warning">
              <span>
                La aprobación aplica la propuesta sobre la agenda. Si aparece un conflicto
                bloqueante, la solicitud seguirá pendiente y la agenda no cambiará. Podés revisar el
                conflicto y rechazarla expresamente si corresponde.
              </span>
            </div>
          ) : null}
          <Field
            label="Nota de resolución"
            hint="Se registra en la solicitud y en la auditoría institucional."
          >
            <Textarea
              value={note}
              onChange={(event) => onNote(event.target.value)}
              rows={3}
              placeholder={
                mode === 'approve'
                  ? 'Criterio de aprobación o indicaciones para el equipo.'
                  : 'Motivo del rechazo.'
              }
            />
          </Field>
          <p className="tiny muted" style={{ margin: 0 }}>
            Se resolverá la versión {current?.version ?? '—'} de la solicitud. Si otra persona la
            modificó mientras tanto, el sistema pedirá actualizar el detalle.
          </p>
        </div>
      </Modal>
  );
}
