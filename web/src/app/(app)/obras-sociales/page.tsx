'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInsurerSchema,
  type CreateInsurerInput,
  type Insurer,
  type PaginatedResult,
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
import { InsurersTable } from './insurers-table';
import { insurerDefaults, insurerFields } from './insurer-fields';
import { CatalogFilters } from '@/components/catalog-filters';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function InsurersPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const canWrite = can('insurers:write');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [deleting, setDeleting] = useState<Insurer | null>(null);

  const insurers = useQuery<PaginatedResult<Insurer>>({
    queryKey: ['insurers', page, debouncedSearch, status],
    queryFn: () =>
      api<PaginatedResult<Insurer>>(
        `/insurers${queryString({ page, pageSize: 30, search: debouncedSearch, status })}`,
      ),
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateInsurerInput }) =>
      id
        ? api<Insurer>(`/insurers/${id}`, { method: 'PATCH', body: values })
        : api<Insurer>('/insurers', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Obra social actualizada.' : 'Obra social creada.');
      void queryClient.invalidateQueries({ queryKey: ['insurers'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setInsurerStatus = useMutation({
    mutationFn: (insurer: Insurer) =>
      api<Insurer>(`/insurers/${insurer.id}/status`, {
        method: 'POST',
        body: { status: insurer.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (insurer) => {
      notify(`Obra social ${insurer.status === 'active' ? 'activada' : 'desactivada'}.`);
      void queryClient.invalidateQueries({ queryKey: ['insurers'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (insurer: Insurer) => api(`/insurers/${insurer.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Obra social eliminada.');
      void queryClient.invalidateQueries({ queryKey: ['insurers'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = insurerDefaults(editing);



  return (
    <>
      <PageHeader
        eyebrow="Catálogos"
        title="Obras sociales"
        lede="Coberturas y financiadores que se asignan a los pacientes. No se registra facturación."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> Nueva obra social
            </Button>
          ) : null
        }
      />

      <CatalogFilters label="obras sociales" placeholder="Nombre o código" search={search} status={status}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }}
      />

      <div className="panel">
        <div className="panel-head">
          <h2>Obras sociales</h2>
          <span className="tiny muted tabular">{insurers.data?.total ?? 0} registros</span>
        </div>
        {insurers.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={4} />
          </div>
        ) : insurers.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(insurers.error)} />
          </div>
        ) : (insurers.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay obras sociales"
            description="Cargá las coberturas que utilizan los pacientes del instituto."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nueva obra social
                </Button>
              ) : undefined
            }
          />
        ) : (
          <InsurersTable
            data={insurers.data!}
            canWrite={canWrite}
            onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setInsurerStatus.mutate(item)}
            onDelete={setDeleting}
            toggleBusy={setInsurerStatus.isPending}
            onPage={setPage}
          />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar obra social' : 'Nueva obra social'}
        schema={createInsurerSchema}
        defaultValues={defaults}
        fields={insurerFields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear obra social'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as CreateInsurerInput })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar obra social"
        description={
          deleting
            ? `Se intentará eliminar "${deleting.name}". Si tiene pacientes asociados, el sistema lo impedirá.`
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
