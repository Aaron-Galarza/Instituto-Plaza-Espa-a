'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HOME_BY_ROLE, loginSchema, type AuthResponse, type LoginInput } from '@plaza/shared';
import { AuthLayout } from '@/components/auth-layout';
import { Button, ErrorBox, Field, Input } from '@/components/ui';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { api, errorMessage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useMutation({
    mutationFn: (values: LoginInput) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body: values }),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      router.replace(HOME_BY_ROLE[data.user.role]);
    },
  });

  useEffect(() => {
    if (login.isSuccess) form.reset({ email: form.getValues('email'), password: '' });
  }, [login.isSuccess, form]);

  return (
    <AuthLayout>
      <div className="auth-form">
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Sistema interno
        </p>
        <h2>Ingresar</h2>
        <p className="auth-lede">Usá el correo y la contraseña que te asignó administración.</p>
        <form onSubmit={form.handleSubmit((values) => login.mutate(values))} noValidate>
          <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="nombre@instituto.org"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field label="Contraseña" error={form.formState.errors.password?.message}>
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((current) => !current)}
                style={{ position: 'absolute', right: 4, top: 3, border: 0 }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>
          {login.isError ? <ErrorBox message={errorMessage(login.error)} /> : null}
          <Button type="submit" variant="primary" disabled={login.isPending}>
            {login.isPending ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <div className="auth-foot">
          Si todavía no existe una cuenta de administración, la primera persona que ingrese debe
          completar la configuración inicial.{' '}
          <Link href="/setup" style={{ color: 'var(--blue)', fontWeight: 600 }}>
            Ir a configuración
          </Link>
          .
        </div>
      </div>
    </AuthLayout>
  );
}
