'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/shell';
import { Button } from '@/components/ui';
import { BrandLogo } from '@/components/brand-logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, error, refresh } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

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

  return <AppShell>{children}</AppShell>;
}
