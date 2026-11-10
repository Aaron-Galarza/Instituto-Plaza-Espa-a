'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { HOME_BY_ROLE } from '@plaza/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const setup = useQuery<{ needsSetup: boolean }>({
    queryKey: ['setup-status'],
    queryFn: () => api('/auth/setup-status'),
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (isLoading || setup.isLoading) return;
    if (user) {
      router.replace(HOME_BY_ROLE[user.role]);
      return;
    }
    if (setup.data?.needsSetup) router.replace('/setup');
    else router.replace('/login');
  }, [user, isLoading, setup.data, setup.isLoading, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--blue)',
        color: 'var(--white)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'Albert Sans, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          Plaza España
        </div>
        <p style={{ color: 'rgba(255,255,255,.66)', fontSize: '.8rem', marginTop: 10 }}>
          Preparando el sistema…
        </p>
      </div>
    </main>
  );
}
