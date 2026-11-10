'use client';
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ink';

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      className={`btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''} ${className}`.trim()}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={`btn btn-icon ${className}`.trim()} aria-label={label} {...props} />;
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label>{label}</label>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`.trim()} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`select ${className}`.trim()} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`textarea ${className}`.trim()} {...props} />;
}

// ---------------------------------------------------------------------------
// Badges & status
// ---------------------------------------------------------------------------

export function Badge({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'blue' | 'ink' | 'mist';
  children: ReactNode;
}) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  resolved: 'Resuelta',
  dismissed: 'Desestimada',
  scheduled: 'Programada',
  modified: 'Modificada',
  pending_resolution: 'Por resolver',
  finished: 'Finalizada',
  regular: 'Habitual',
  absence: 'Ausencia',
  block: 'Bloqueo',
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'active' || status === 'approved' || status === 'resolved'
      ? 'blue'
      : status === 'pending' || status === 'pending_resolution'
        ? 'ink'
        : 'mist';
  return <Badge tone={tone}>{STATUS_LABELS[status] ?? status}</Badge>;
}

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------
