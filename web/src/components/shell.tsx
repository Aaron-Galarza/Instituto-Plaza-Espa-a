'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { INSTITUTION, ROLE_LABELS } from '@plaza/shared';
import { useAuth } from '@/lib/auth';
import { BrandLogo } from './brand-logo';
import { LogOutIcon, MenuIcon, UserIcon, XIcon } from './icons';
import { PAGE_TITLES } from './shell-config';
import { ShellSidebar } from './shell-sidebar';

function formatToday(): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: INSTITUTION.timezone,
  }).format(new Date());
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, can } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (!user) return null;

  const page = PAGE_TITLES[pathname] ?? {
    title: 'Plaza España',
    context: INSTITUTION.city,
  };
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="shell">
      {mobileOpen ? (
        <button
          className="mobile-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <ShellSidebar mobileOpen={mobileOpen} pathname={pathname} role={user.role} can={can} />

      <div className="main-column">
        <header className="topbar">
          <span className="topbar-brand mobile-only">
            <BrandLogo variant="isotipo" className="topbar-isotipo" />
          </span>
          <div className="topbar-title">
            <p>{page.title}</p>
            <span>{page.context}</span>
          </div>
          <span className="topbar-date">{formatToday()}</span>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((current) => !current)}
              data-help="Abre el menú de tu cuenta. Ahí podés ver tu perfil o cerrar sesión."
              className="row gap-8"
              style={{
                border: '1px solid var(--line)',
                background: 'var(--white)',
                borderRadius: 999,
                padding: '4px 10px 4px 4px',
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--blue)',
                  color: 'var(--white)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'Albert Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                }}
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="tiny" style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <strong style={{ display: 'block', fontSize: '0.74rem' }}>{user.name}</strong>
                <span style={{ color: 'var(--slate)' }}>{ROLE_LABELS[user.role]}</span>
              </span>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 220,
                  background: 'var(--white)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 4,
                  boxShadow: '0 24px 50px -30px rgba(29,30,28,.6)',
                  padding: 5,
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                  <div className="tiny" style={{ fontWeight: 600 }}>
                    {user.email}
                  </div>
                </div>
                <Link
                  href="/perfil"
                  role="menuitem"
                  className="nav-link"
                  style={{ color: 'var(--ink)', marginTop: 4 }}
                  onClick={() => setMenuOpen(false)}
                >
                  <UserIcon />
                  Mi perfil
                </Link>
                <button
                  role="menuitem"
                  className="nav-link"
                  style={{
                    color: 'var(--ink)',
                    width: '100%',
                    border: 0,
                    background: 'transparent',
                  }}
                  onClick={onLogout}
                >
                  <LogOutIcon />
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
          <button
            className="btn btn-icon mobile-only"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </header>
        <main className="main">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
