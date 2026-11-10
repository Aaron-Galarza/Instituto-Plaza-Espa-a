'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceSchema,
  type CreateServiceInput,
  type PaginatedResult,
  type Service,
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
import { CatalogTable } from '@/components/catalog-table';
import { serviceColumns } from './service-columns';
import { serviceDefaults, serviceFields } from './service-fields';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function ServicesPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const canWrite = can('services:write');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const services = useQuery<PaginatedResult<Service>>({
    queryKey: ['services', page, debouncedSearch, status],
    queryFn: () =>
      api<PaginatedResult<Service>>(
        `/services${queryString({ page, pageSize: 30, search: debouncedSearch, status })}`,
      ),
  });

  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CreateServiceInput }) =>
      id
        ? api<Service>(`/services/${id}`, { method: 'PATCH', body: values })
        : api<Service>('/services', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Prestación actualizada.' : 'Prestación creada.');
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setServiceStatus = useMutation({
    mutationFn: (service: Service) =>
      api<Service>(`/services/${service.id}/status`, {
        method: 'POST',
        body: { status: service.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (service) => {
      notify(`Prestación ${service.status === 'active' ? 'activada' : 'desactivada'}.`);
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (service: Service) => api(`/services/${service.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Prestación eliminada.');
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = serviceDefaults(editing);

  return (
    <>
      <PageHeader
        eyebrow="Catálogos"
        title="Prestaciones"
        lede="Servicios habilitados y modalidades de atención. Cada prestación define qué formas de planificación admite."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> Nueva prestación
            </Button>
          ) : null
        }
      />

      <CatalogFilters label="prestaciones" placeholder="Nombre de la prestación" search={search} status={status}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }}
      />

      <div className="panel">
        <div className="panel-head">
          <h2>Prestaciones</h2>
          <span className="tiny muted tabular">{services.data?.total ?? 0} registros</span>
        </div>
        {services.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={4} />
          </div>
        ) : services.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(services.error)} />
          </div>
        ) : (services.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay prestaciones"
            description="Cargá las prestaciones que ofrece el instituto para poder planificar jornadas."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nueva prestación
                </Button>
              ) : undefined
            }
          />
        ) : (
          <CatalogTable data={services.data!} columns={serviceColumns} canWrite={canWrite}
            onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setServiceStatus.mutate(item)}
            onDelete={setDeleting} toggleBusy={setServiceStatus.isPending} onPage={setPage}
          />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar prestación' : 'Nueva prestación'}
        schema={createServiceSchema}
        defaultValues={defaults}
        fields={serviceFields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear prestación'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as CreateServiceInput })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar prestación"
        description={
          deleting
            ? `Se intentará eliminar "${deleting.name}". Si está asociada a grupos o jornadas, el sistema lo impedirá.`
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
