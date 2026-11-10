import { INSTITUTION } from '@plaza/shared';
import { BrandLogo } from './brand-logo';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand" aria-label="Instituto de Rehabilitación Plaza España">
        <div className="auth-brand-identity">
          <BrandLogo variant="vertical" className="auth-brand-logo" priority />
          <span>{INSTITUTION.city}</span>
        </div>
        <div>
          <h1>Planificar la rehabilitación, sin perder el hilo.</h1>
          <p className="auth-sub">
            Agenda, disponibilidad y cambios en un mismo lugar. Una herramienta interna para ordenar
            el trabajo cotidiano del instituto.
          </p>
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,.62)',
          }}
        >
          Zona horaria institucional · America/Argentina/Cordoba
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </div>
  );
}
