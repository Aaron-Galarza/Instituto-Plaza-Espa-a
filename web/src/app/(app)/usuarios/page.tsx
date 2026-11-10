'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type PaginatedResult,
  type ResetPasswordInput,
  type UpdateUserInput,
  type User,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import {
  Button,
  EmptyState,
  ErrorBox,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { UsersTable } from './users-table';
import { UserFilters } from './user-filters';
import { UserResetModal } from './user-reset-modal';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue, useReferenceData } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { userDefaults, userFields } from './user-fields';

export default function UsersPage() {
  const { can, user: sessionUser } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const reference = useReferenceData();
  const canManage = can('users:manage');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  const users = useQuery<PaginatedResult<User>>({
    queryKey: ['users', page, debouncedSearch, role, status],
    queryFn: () =>
      api<PaginatedResult<User>>(
        `/users${queryString({ page, pageSize: 25, search: debouncedSearch, role, status })}`,
      ),
    enabled: canManage,
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateUserInput | UpdateUserInput }) =>
      id
        ? api<User>(`/users/${id}`, { method: 'PATCH', body: values })
        : api<User>('/users', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Usuario actualizado.' : 'Usuario creado.');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setUserStatus = useMutation({
    mutationFn: (target: User) =>
      api<User>(`/users/${target.id}/status`, {
        method: 'POST',
        body: { status: target.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (target) => {
      notify(`Usuario ${target.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ResetPasswordInput }) =>
      api(`/users/${id}/reset-password`, { method: 'POST', body: values }),
    onSuccess: () => {
      notify('Contraseña restablecida. La persona deberá ingresar con la nueva clave.');
      setResetting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = userDefaults(editing);
  const { createFields, editFields, roleOptions } = userFields(reference.data?.professionals ?? [], editing);
  if (!canManage) {
    return (
      <>
        <PageHeader eyebrow="Administración" title="Usuarios" />
        <ErrorBox message="No tenés permisos para administrar usuarios." />
      </>
    );
  }

  const professionalName = (id: string | null | undefined) => {
    const professional = reference.data?.professionals.find((item) => item.id === id);
    return professional ? `${professional.firstName} ${professional.lastName}` : '—';
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        lede="Accesos al sistema y roles. Los permisos se validan siempre en el servidor."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon /> Nuevo usuario
          </Button>
        }
      />

      <UserFilters search={search} role={role} status={status} roleOptions={roleOptions}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onRole={(value) => { setRole(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }} />

      <div className="panel">
        <div className="panel-head">
          <h2>Cuentas</h2>
          <span className="tiny muted tabular">{users.data?.total ?? 0} usuarios</span>
        </div>
        {users.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={4} />
          </div>
        ) : users.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(users.error)} />
          </div>
        ) : (users.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay usuarios"
            description="Creá la primera cuenta de acceso para el equipo."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon /> Nuevo usuario
              </Button>
            }
          />
        ) : (
          <UsersTable data={users.data!} sessionUserId={sessionUser?.id} professionalName={professionalName}
            onEdit={(item) => { setEditing(item); setFormOpen(true); }} onReset={setResetting}
            onToggle={(item) => setUserStatus.mutate(item)} toggleBusy={setUserStatus.isPending}
            onPage={setPage} />
        )}
      </div>

      <EntityFormModal
        key={editing ? `edit-${editing.id}` : 'create'}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        description="Los roles definen permisos operativos. La cuenta de administración inicial no puede recrearse desde aquí."
        schema={editing ? updateUserSchema : createUserSchema}
        defaultValues={defaults}
        fields={editing ? editFields : createFields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear usuario'}
        onSubmit={(values) =>
          save.mutate({
            id: editing?.id,
            values: values as CreateUserInput | UpdateUserInput,
          })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <UserResetModal user={resetting} onClose={() => setResetting(null)}
        onSubmit={(id, values) => resetPassword.mutate({ id, values })}
        busy={resetPassword.isPending} error={resetPassword.isError ? errorMessage(resetPassword.error) : undefined} />
    </>
  );
}
