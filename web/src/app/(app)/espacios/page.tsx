'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSpaceSchema,
  type CreateSpaceInput,
  type PaginatedResult,
  type Space,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { CatalogFilters } from '@/components/catalog-filters';
import { CatalogTable, type CatalogColumn } from '@/components/catalog-table';
import { spaceDefaults, spaceFields } from './space-fields';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';

const spaceColumns: CatalogColumn<Space>[] = [
  { header: 'Espacio', className: 'row-title', render: (space) => space.name },
  { header: 'Capacidad', className: 'tabular', render: (space) => `${space.capacity} paciente${space.capacity === 1 ? '' : 's'}` },
  { header: 'Descripción', className: 'muted', render: (space) => space.description ?? '—' },
];

export default function SpacesPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const canWrite = can('spaces:write');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState<Space | null>(null);

  const spaces = useQuery<PaginatedResult<Space>>({
    queryKey: ['spaces', page, debouncedSearch, status],
    queryFn: () =>
      api<PaginatedResult<Space>>(
        `/spaces${queryString({ page, pageSize: 30, search: debouncedSearch, status })}`,
      ),
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateSpaceInput }) =>
      id
        ? api<Space>(`/spaces/${id}`, { method: 'PATCH', body: values })
        : api<Space>('/spaces', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Espacio actualizado.' : 'Espacio creado.');
      void queryClient.invalidateQueries({ queryKey: ['spaces'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setSpaceStatus = useMutation({
    mutationFn: (space: Space) =>
      api<Space>(`/spaces/${space.id}/status`, {
        method: 'POST',
        body: { status: space.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (space) => {
      notify(`Espacio ${space.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['spaces'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (space: Space) => api(`/spaces/${space.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Espacio eliminado.');
      void queryClient.invalidateQueries({ queryKey: ['spaces'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = spaceDefaults(editing);

  return (
    <>
      <PageHeader
        eyebrow="Catálogos"
        title="Espacios"
        lede="Consultorios y salas con su capacidad simultánea. La agenda controla que no se exceda el cupo."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> Nuevo espacio
            </Button>
          ) : null
        }
      />

      <CatalogFilters label="espacios" placeholder="Nombre del espacio" search={search} status={status}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }}
      />

      <div className="panel">
        <div className="panel-head">
          <h2>Espacios</h2>
          <span className="tiny muted tabular">{spaces.data?.total ?? 0} registros</span>
        </div>
        {spaces.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={4} />
          </div>
        ) : spaces.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(spaces.error)} />
          </div>
        ) : (spaces.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay espacios"
            description="Cargá consultorios y salas para asignar las jornadas."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nuevo espacio
                </Button>
              ) : undefined
            }
          />
        ) : (
          <CatalogTable data={spaces.data!} columns={spaceColumns} canWrite={canWrite}
            onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setSpaceStatus.mutate(item)}
            onDelete={setDeleting} toggleBusy={setSpaceStatus.isPending} onPage={setPage}
          />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar espacio' : 'Nuevo espacio'}
        schema={createSpaceSchema}
        defaultValues={defaults}
        fields={spaceFields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear espacio'}
        onSubmit={(values) => save.mutate({ id: editing?.id, values: values as CreateSpaceInput })}
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar espacio"
        description={
          deleting
            ? `Se intentará eliminar "${deleting.name}". Si está asociado a grupos o jornadas, el sistema lo impedirá.`
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
