'use client';

import Link from 'next/link';
import { ROLE_LABELS, INSTITUTION, type Role } from '@plaza/shared';
import { BrandLogo } from './brand-logo';
import { GROUPS } from './shell-config';

export function ShellSidebar({ mobileOpen, pathname, role, can }: {
  mobileOpen: boolean;
  pathname: string;
  role: Role;
  can: (permission: string) => boolean;
}) {
  return (
      <aside className="sidebar" data-open={mobileOpen}>
        <div className="sidebar-mark">
          <Link href="/" className="sidebar-brand-link" aria-label="Plaza España, ir al inicio">
            <BrandLogo variant="horizontal" className="sidebar-logo" priority />
          </Link>
          <span>{INSTITUTION.city}</span>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {GROUPS.map((group) => {
            const items = group.items.filter((item) => {
              if (item.roles && !item.roles.includes(role)) return false;
              if (item.permission && !can(item.permission)) return false;
              return true;
            });
            if (items.length === 0) return null;
            return (
              <div className="nav-group" key={group.label}>
                <div className="nav-group-label">{group.label}</div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-link"
                      data-active={active}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div>{ROLE_LABELS[role]}</div>
          <div style={{ marginTop: 2 }}>America/Argentina/Cordoba</div>
        </div>
      </aside>

  );
}
