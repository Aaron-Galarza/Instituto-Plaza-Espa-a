'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { HOME_BY_ROLE } from '@plaza/shared';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/shell';
import { GROUPS } from '@/components/shell-config';
import { Button } from '@/components/ui';
import { BrandLogo } from '@/components/brand-logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, error, refresh, can } = useAuth();
  const navItem = GROUPS.flatMap((group) => group.items).find((item) => item.href === pathname);
  const restricted = Boolean(user && navItem && (
    (navItem.roles && !navItem.roles.includes(user.role)) ||
    (navItem.permission && !can(navItem.permission))
  ));

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (restricted && user) router.replace(HOME_BY_ROLE[user.role]);
  }, [restricted, user, router]);

  if (isLoading) {
    return (
      <div className="boot-screen" role="status" aria-label="Cargando sesión">
        <BrandLogo variant="circular" className="boot-logo" priority />
        <p>Verificando sesión…</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="boot-screen">
        <BrandLogo variant="circular" className="boot-logo" priority />
        <p>No se pudo conectar con el servidor.</p>
        <Button variant="secondary" onClick={() => void refresh()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!user) return null;
  if (restricted) return null;

  return <AppShell>{children}</AppShell>;
}
