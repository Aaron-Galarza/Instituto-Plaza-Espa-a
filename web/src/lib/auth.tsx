'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, SessionUser } from '@plaza/shared';
import { api, isUnauthorized } from './api';

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  error: unknown;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const me = useQuery<AuthResponse | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api<AuthResponse>('/auth/me');
      } catch (error) {
        if (isUnauthorized(error)) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data?.user ?? null,
      isLoading: me.isLoading,
      error: me.error,
      can: (permission: string) => me.data?.user.permissions.includes(permission) ?? false,
      refresh,
      logout,
    }),
    [me.data, me.isLoading, me.error, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}

export function useRequireAuth(): AuthContextValue {
  const auth = useAuth();
  return auth;
}
