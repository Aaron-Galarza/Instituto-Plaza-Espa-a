'use client';
import { CheckIcon } from './icons';

export function InlineCheck({ checked }: { checked: boolean }) {
  if (!checked) return null;
  return (
    <span style={{ color: 'var(--blue)' }} aria-label="Sí">
      <CheckIcon style={{ width: 16, height: 16 }} />
    </span>
  );
}

export function PersonCell({ name, detail }: { name: string; detail?: string }) {
  return (
    <div className="stack" style={{ gap: 1 }}>
      <span className="row-title">{name}</span>
      {detail ? <span className="tiny muted">{detail}</span> : null}
    </div>
  );
}
