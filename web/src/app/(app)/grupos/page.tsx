'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCareGroupSchema,
  type CareGroup,
  type CreateCareGroupInput,
  type PaginatedResult,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import { Button, ConfirmDialog, EmptyState, ErrorBox, LoadingBlock, PageHeader } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { CatalogFilters } from '@/components/catalog-filters';
import { CatalogTable } from '@/components/catalog-table';
import { groupColumns } from './group-columns';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue, useReferenceData } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { groupDefaults, groupFields } from './group-fields';

export default function GroupsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const reference = useReferenceData();
  const canWrite = can('groups:write');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CareGroup | null>(null);
  const [deleting, setDeleting] = useState<CareGroup | null>(null);

  const groups = useQuery<PaginatedResult<CareGroup>>({
    queryKey: ['care-groups', page, debouncedSearch, status],
    queryFn: () =>
      api<PaginatedResult<CareGroup>>(
        `/care-groups${queryString({ page, pageSize: 30, search: debouncedSearch, status })}`,
      ),
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateCareGroupInput }) =>
      id
        ? api<CareGroup>(`/care-groups/${id}`, { method: 'PATCH', body: values })
        : api<CareGroup>('/care-groups', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Grupo actualizado.' : 'Grupo creado.');
      void queryClient.invalidateQueries({ queryKey: ['care-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setGroupStatus = useMutation({
    mutationFn: (group: CareGroup) =>
      api<CareGroup>(`/care-groups/${group.id}/status`, {
        method: 'POST',
        body: { status: group.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (group) => {
      notify(`Grupo ${group.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['care-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (group: CareGroup) => api(`/care-groups/${group.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Grupo eliminado.');
      void queryClient.invalidateQueries({ queryKey: ['care-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = groupDefaults(editing);
  const fields = groupFields(reference.data?.services ?? [], reference.data?.professionals ?? [], reference.data?.spaces ?? [], editing);

  const columns = groupColumns(reference.data);

  return (
    <>
      <PageHeader
        eyebrow="Catálogos"
        title="Grupos"
        lede="Agrupaciones de pacientes y profesionales con cupo propio. Se usan en jornadas de modalidad grupal o compartida."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> Nuevo grupo
            </Button>
          ) : null
        }
      />

      <CatalogFilters label="grupos" placeholder="Nombre del grupo" search={search} status={status}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }}
      />

      <div className="panel">
        <div className="panel-head">
          <h2>Grupos</h2>
          <span className="tiny muted tabular">{groups.data?.total ?? 0} registros</span>
        </div>
        {groups.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={4} />
          </div>
        ) : groups.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(groups.error)} />
          </div>
        ) : (groups.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay grupos"
            description="Creá grupos para planificar prestaciones con cupo y profesionales estables."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nuevo grupo
                </Button>
              ) : undefined
            }
          />
        ) : (
          <CatalogTable data={groups.data!} columns={columns} canWrite={canWrite}
            onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setGroupStatus.mutate(item)}
            onDelete={setDeleting} toggleBusy={setGroupStatus.isPending} onPage={setPage}
          />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar grupo' : 'Nuevo grupo'}
        description="Un grupo debe tener modalidad grupal o compartida y al menos un profesional."
        schema={createCareGroupSchema}
        defaultValues={defaults}
        fields={fields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear grupo'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as CreateCareGroupInput })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar grupo"
        description={
          deleting
            ? `Se intentará eliminar "${deleting.name}". Si tiene jornadas asociadas, el sistema lo impedirá.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
        }}
      />
    </>
  );
}
