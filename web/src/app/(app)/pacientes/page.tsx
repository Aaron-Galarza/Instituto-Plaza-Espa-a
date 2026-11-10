'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPatientSchema,
  type CreatePatientInput,
  type PaginatedResult,
  type Patient,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import {
  Button,
  EmptyState,
  ErrorBox,
  LoadingBlock,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { PatientsTable } from './patients-table';
import { PatientDetail } from './patient-detail';
import { PatientFilters } from './patient-filters';
import { PatientHeader } from './patient-header';
import { PatientDeleteDialog } from './patient-delete-dialog';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue, useReferenceData } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { patientDefaults, patientFields } from './patient-fields';

interface SaveInput {
  id?: string;
  values: CreatePatientInput;
}

export default function PatientsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const reference = useReferenceData();
  const canWrite = can('patients:write');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [insurerId, setInsurerId] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    setViewId(new URLSearchParams(window.location.search).get('patientId'));
  }, []);

  const detail = useQuery<Patient>({
    queryKey: ['patient-detail', viewId],
    queryFn: () => api<Patient>(`/patients/${viewId}`),
    enabled: Boolean(viewId),
  });

  const patients = useQuery<PaginatedResult<Patient>>({
    queryKey: ['patients', page, debouncedSearch, status, insurerId],
    queryFn: () =>
      api<PaginatedResult<Patient>>(
        `/patients${queryString({
          page,
          pageSize: 20,
          search: debouncedSearch,
          status,
          insurerId,
        })}`,
      ),
  });

  const save = useMutation({
    mutationFn: ({ id, values }: SaveInput) =>
      id
        ? api<Patient>(`/patients/${id}`, { method: 'PATCH', body: values })
        : api<Patient>('/patients', { method: 'POST', body: values }),
    onSuccess: (_result, variables) => {
      notify(variables.id ? 'Paciente actualizado.' : 'Paciente creado.');
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFormOpen(false);
      setEditing(null);
    },
  });

  const setPatientStatus = useMutation({
    mutationFn: (patient: Patient) =>
      api<Patient>(`/patients/${patient.id}/status`, {
        method: 'POST',
        body: { status: patient.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (patient) => {
      notify(`Paciente ${patient.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (patient: Patient) => api(`/patients/${patient.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Paciente eliminado.');
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.invalidateQueries({ queryKey: ['reference-data'] });
      setDeleting(null);
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const defaults = patientDefaults(editing);
  const fields = patientFields(reference.data?.insurers ?? [], editing);

  const insurerName = (id: string | null | undefined) =>
    id ? (reference.data?.insurers.find((insurer) => insurer.id === id)?.name ?? '—') : '—';

  return (
    <>
      <PatientHeader canWrite={canWrite} onNew={() => { setEditing(null); setFormOpen(true); }} />

      <PatientFilters search={search} status={status} insurerId={insurerId}
        insurers={reference.data?.insurers ?? []}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        onStatus={(value) => { setStatus(value); setPage(1); }}
        onInsurer={(value) => { setInsurerId(value); setPage(1); }}
      />

      <div className="panel">
        <div className="panel-head">
          <h2>Listado</h2>
          <span className="tiny muted tabular">{patients.data?.total ?? 0} registros</span>
        </div>
        {patients.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={5} />
          </div>
        ) : patients.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(patients.error)} />
          </div>
        ) : (patients.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay pacientes"
            description="Probá con otros filtros o creá el primer paciente del instituto."
            action={
              canWrite ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <PlusIcon /> Nuevo paciente
                </Button>
              ) : undefined
            }
          />
        ) : (
          <PatientsTable data={patients.data!} canWrite={canWrite} insurerName={insurerName}
            onView={setViewId} onEdit={(item) => { setEditing(item); setFormOpen(true); }}
            onToggle={(item) => setPatientStatus.mutate(item)} onDelete={setDeleting}
            toggleBusy={setPatientStatus.isPending} onPage={setPage} />
        )}
      </div>

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar paciente' : 'Nuevo paciente'}
        description="Datos identificatorios y administrativos. No se registran datos clínicos."
        schema={createPatientSchema}
        defaultValues={defaults}
        fields={fields}
        submitLabel={editing ? 'Guardar cambios' : 'Crear paciente'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as CreatePatientInput })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <PatientDetail open={Boolean(viewId)} onClose={() => setViewId(null)}
        detail={detail} canWrite={canWrite} insurerName={insurerName} />

      <PatientDeleteDialog patient={deleting} busy={remove.isPending}
        onCancel={() => setDeleting(null)} onConfirm={(patient) => remove.mutate(patient)} />
    </>
  );
}
