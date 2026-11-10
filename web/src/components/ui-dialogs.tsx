'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './icons';
import { IconButton } from './ui-controls';

function usePortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  initialFocusRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => initialFocusRef.current?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'default' | 'wide';
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'default',
}: ModalProps) {
  const mounted = usePortal();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(open, onClose, dialogRef);

  if (!mounted || !open) return null;
  return createPortal(
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        data-size={size === 'default' ? undefined : size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <XIcon />
          </IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, description, children, footer }: DrawerProps) {
  const mounted = usePortal();
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(open, onClose, drawerRef);

  if (!mounted || !open) return null;
  return createPortal(
    <div
      className="overlay"
      data-side="right"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={drawerRef}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <XIcon />
          </IconButton>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Confirm
// ---------------------------------------------------------------------------
