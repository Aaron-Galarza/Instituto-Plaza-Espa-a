'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  INSTITUTION,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  changePasswordSchema,
  type ChangePasswordInput,
} from '@plaza/shared';
import { Badge, Button, ErrorBox, Field, Input, PageHeader, Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useReferenceData } from '@/lib/queries';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const reference = useReferenceData();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const changePassword = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      api('/auth/change-password', { method: 'POST', body: values }),
    onSuccess: async () => {
      notify('Contraseña actualizada. Volvé a ingresar con la nueva clave.');
      await logout();
      router.replace('/login');
    },
  });

  if (!user) return null;

  const professional = user.professionalId
    ? reference.data?.professionals.find((item) => item.id === user.professionalId)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        lede="Datos de acceso, rol y seguridad de la cuenta."
      />

      <div className="dash-grid" style={{ marginTop: 0 }}>
        <div className="stack gap-16">
          <Panel title="Identidad">
            <div className="form-grid">
              <Field label="Nombre y apellido">
                <Input value={user.name} readOnly aria-readonly="true" />
              </Field>
              <Field label="Correo electrónico">
                <Input value={user.email} readOnly aria-readonly="true" />
              </Field>
              <Field label="Rol">
                <div style={{ paddingTop: 8 }}>
                  <Badge tone="blue">{ROLE_LABELS[user.role]}</Badge>
                </div>
              </Field>
              <Field label="Profesional vinculado">
                <Input
                  value={
                    professional
                      ? `${professional.firstName} ${professional.lastName}`
                      : 'Sin vínculo'
                  }
                  readOnly
                  aria-readonly="true"
                />
              </Field>
            </div>
            <p className="small muted" style={{ margin: '14px 0 0' }}>
              {ROLE_DESCRIPTIONS[user.role]}
            </p>
            <p className="tiny muted" style={{ margin: '8px 0 0' }}>
              Los permisos efectivos se validan en el servidor en cada operación.
            </p>
          </Panel>

          <Panel title="Cambiar contraseña">
            <form
              onSubmit={form.handleSubmit((values) => changePassword.mutate(values))}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
            >
              <Field
                label="Contraseña actual"
                error={form.formState.errors.currentPassword?.message}
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(form.formState.errors.currentPassword)}
                  {...form.register('currentPassword')}
                />
              </Field>
              <Field
                label="Nueva contraseña"
                error={form.formState.errors.newPassword?.message}
                hint="Mínimo 10 caracteres, con letras y números."
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(form.formState.errors.newPassword)}
                  {...form.register('newPassword')}
                />
              </Field>
              {changePassword.isError ? (
                <ErrorBox message={errorMessage(changePassword.error)} />
              ) : null}
              <div>
                <Button type="submit" variant="primary" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        <div className="stack gap-16">
          <Panel title="Sesión">
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Institución</dt>
                <dd>{INSTITUTION.name}</dd>
              </div>
              <div className="detail-row">
                <dt>Ciudad</dt>
                <dd>{INSTITUTION.city}</dd>
              </div>
              <div className="detail-row">
                <dt>Zona horaria</dt>
                <dd>{INSTITUTION.timezone}</dd>
              </div>
              <div className="detail-row">
                <dt>Permisos</dt>
                <dd>{user.permissions.length} permisos activos</dd>
              </div>
            </dl>
            <p className="tiny muted" style={{ margin: '12px 0 0' }}>
              Si cambiás la contraseña, se cierran todas las sesiones y se solicita un nuevo
              ingreso.
            </p>
          </Panel>

          <Panel title="Permisos activos">
            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              {user.permissions.map((permission) => (
                <Badge key={permission} tone="mist">
                  {permission}
                </Badge>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
