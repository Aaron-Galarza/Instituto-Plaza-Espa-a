'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setupSchema, type AuthResponse, type SetupInput } from '@plaza/shared';
import { AuthLayout } from '@/components/auth-layout';
import { Button, ErrorBox, Field, Input, LoadingBlock } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';

export default function SetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useQuery<{ needsSetup: boolean }>({
    queryKey: ['setup-status'],
    queryFn: () => api('/auth/setup-status'),
    retry: false,
    staleTime: 0,
  });
  const form = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const setup = useMutation({
    mutationFn: (values: SetupInput) =>
      api<AuthResponse>('/auth/setup', { method: 'POST', body: values }),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.setQueryData(['setup-status'], { needsSetup: false });
      router.replace('/agenda');
    },
  });

  if (status.isLoading) {
    return (
      <AuthLayout>
        <div className="auth-form">
          <LoadingBlock rows={3} />
        </div>
      </AuthLayout>
    );
  }

  if (status.data && !status.data.needsSetup) {
    return (
      <AuthLayout>
        <div className="auth-form">
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            Configuración inicial
          </p>
          <h2>Ya está completa</h2>
          <p className="auth-lede">
            El sistema ya tiene una cuenta de administración. Ingresá con tus credenciales.
          </p>
          {setup.isError ? <ErrorBox message={errorMessage(setup.error)} /> : null}
          <Link href="/login" className="btn btn-primary">
            Ir a ingresar
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Primera puesta en marcha
        </p>
        <h2>Crear administración</h2>
        <p className="auth-lede">
          Esta cuenta tendrá permisos operativos completos. Después podés crear el resto de los
          usuarios desde el sistema.
        </p>
        <form onSubmit={form.handleSubmit((values) => setup.mutate(values))} noValidate>
          <Field label="Nombre y apellido" error={form.formState.errors.name?.message}>
            <Input
              autoComplete="name"
              placeholder="Nombre de la persona responsable"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
          </Field>
          <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="administracion@instituto.org"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field
            label="Contraseña"
            error={form.formState.errors.password?.message}
            hint="Al menos 10 caracteres, con letras y números."
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Creá una contraseña segura"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </Field>
          {setup.isError ? <ErrorBox message={errorMessage(setup.error)} /> : null}
          <Button type="submit" variant="primary" disabled={setup.isPending}>
            {setup.isPending ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
          </Button>
        </form>
        <div className="auth-foot">
          ¿La cuenta ya existe?{' '}
          <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>
            Ingresar
          </Link>
          .
        </div>
      </div>
    </AuthLayout>
  );
}
