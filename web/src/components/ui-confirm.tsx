'use client';
import { Button } from './ui-controls';
import { Modal } from './ui-dialogs';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="small"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Volver
          </Button>
          <Button variant="ink" onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="small" style={{ margin: 0 }}>
        {description}
      </p>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
