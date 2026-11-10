'use client';
import { type ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {actions ? (
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p className="small" style={{ maxWidth: '44ch', margin: 0 }}>
        {description}
      </p>
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="stack gap-8" aria-label="Cargando" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{ height: index === 0 ? 44 : 30, width: `${100 - index * 5}%` }}
        />
      ))}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      {message}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className = '',
  bodyClassName = 'panel-pad',
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || actions ? (
        <div className="panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
