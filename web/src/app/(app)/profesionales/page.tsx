'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProfessionalSchema,
  type CreateProfessionalInput,
  type PaginatedResult,
  type Professional,
  type User,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import {
  Button,
  EmptyState,
  ErrorBox,
  LoadingBlock,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { ProfessionalsTable } from './professionals-table';
import { ProfessionalFilters } from './professional-filters';
import { ProfessionalDetail } from './professional-detail';
import { ProfessionalHeader } from './professional-header';
import { ProfessionalDeleteDialog } from './professional-delete-dialog';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { professionalDefaults, professionalFields } from './professional-fields';

export default function ProfessionalsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const canWrite = can('professionals:write');
  const canSeeUsers = can('users:manage');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [deleting, setDeleting] = useState<Professional | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    setViewId(new URLSearchParams(window.location.search).get('professionalId'));
  }, []);

  const detail = useQuery<Professional>({
    queryKey: ['professional-detail', viewId],
    queryFn: () => api<Professional>(`/professionals/${viewId}`),
    enabled: Boolean(viewId),
  });

  const professionals = useQuery<PaginatedResult<Professional>>({
    queryKey: ['professionals', page, debouncedSearch, status],
    queryFn: () =>
      api<PaginatedResult<Professional>>(
        `/professionals${queryString({ page, pageSize: 20, search: debouncedSearch, status })}`,
      ),
  });

  const users = useQuery<PaginatedResult<User>>({
    queryKey: ['users', 'professional-links'],
    queryFn: () => api<PaginatedResult<User>>('/users?page=1&pageSize=100'),
    enabled: canSeeUsers,
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateProfessionalInput }) =>
      id
        ? api<Professional>(`/professionals/${id}`, { method: 'PATCH', body: values })
        : api<Professional>('/professionals', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Profesional actualizado.' : 'Profesional creado.');
      void queryClient.invalidateQueries({ queryKey: ['professionals'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setProfessionalStatus = useMutation({
    mutationFn: (professional: Professional) =>
      api<Professional>(`/professionals/${professional.id}/status`, {
        method: 'POST',
        body: { status: professional.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (professional) => {
      notify(`Profesional ${professional.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['professionals'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (professional: Professional) =>
      api(`/professionals/${professional.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Profesional eliminado.');
      void queryClient.invalidateQueries({ queryKey: ['professionals'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = professionalDefaults(editing);
  const fields = professionalFields(canSeeUsers, users.data?.items ?? []);

  const linkedUserName = (userId: string | null | undefined) =>
    userId ? (users.data?.items.find((user) => user.id === userId)?.name ?? '—') : '—';

  return (
    <>
      <ProfessionalHeader canWrite={canWrite} onNew={() => { setEditing(null); setFormOpen(true); }} />

      <ProfessionalFilters search={search} status={status}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }} />

      <div className="panel">
        <div className="panel-head">
          <h2>Equipo</h2>
          <span className="tiny muted tabular">{professionals.data?.total ?? 0} profesionales</span>
        </div>
        {professionals.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={5} />
          </div>
        ) : professionals.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(professionals.error)} />
          </div>
        ) : (professionals.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay profesionales"
            description="Cargá al equipo para poder asignar jornadas y disponibilidad."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nuevo profesional
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ProfessionalsTable data={professionals.data!} canWrite={canWrite} linkedUserName={linkedUserName}
            onView={setViewId} onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setProfessionalStatus.mutate(item)} onDelete={setDeleting}
            toggleBusy={setProfessionalStatus.isPending} onPage={setPage} />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar profesional' : 'Nuevo profesional'}
        description="Datos de contacto, especialidades y color de agenda. El vínculo con un usuario es opcional."
        schema={createProfessionalSchema}
        defaultValues={defaults}
        fields={fields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear profesional'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as CreateProfessionalInput })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <ProfessionalDetail open={Boolean(viewId)} onClose={() => setViewId(null)} detail={detail} />

      <ProfessionalDeleteDialog professional={deleting} busy={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={(item) => remove.mutate(item)} />
    </>
  );
}
