'use client';

import { useState } from 'react';
import {
  formatIsoDateTime,
  type ProfessionalAvailability,
} from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';
import { ConfirmDialog, ErrorBox, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';
import { availabilityFields } from './availability-fields';
import { useAvailabilityEntries } from './use-availability-entries';
import { RegularPanel } from './regular-panel';
import { AbsencesPanel } from './absences-panel';
import { IssuesPanel } from './issues-panel';
import { AvailabilityControls } from './availability-controls';
import { ResolutionModal } from './resolution-modal';
import { useAvailabilityData } from './use-availability-data';
import { useIssueResolution } from './use-issue-resolution';
import { availabilityFormSchema, validityLabel, type Tab, type IssueStatusFilter, type AvailabilityFormValues } from './availability-form';

export default function AvailabilityPage() {
  const { can } = useAuth();
  const canRead = can('availability:read');
  const canWrite = can('availability:write');

  const [tab, setTab] = useState<Tab>('regular');
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState('');
  const [absenceKind, setAbsenceKind] = useState('');
  const [issueStatus, setIssueStatus] = useState<IssueStatusFilter>('pending');
  const [absenceFilter, setAbsenceFilter] = useState<{ id: string; label: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProfessionalAvailability | null>(null);
  const [deleting, setDeleting] = useState<ProfessionalAvailability | null>(null);

  const { professionals, professionalName, availability, issues, regularEntries,
    absenceEntries, filteredIssues, pendingIssueCount, activeRegularCount,
    activeAbsenceCount } = useAvailabilityData(professionalId, status, absenceKind,
      issueStatus, absenceFilter, canRead);

  const { resolving, resolveAction, setResolveAction, replacementId, setReplacementId,
    rescheduleDate, setRescheduleDate, rescheduleStart, setRescheduleStart,
    resolveReason, setResolveReason, resolveError, setResolveError, resolveIssue,
    openResolution, closeResolution, replacementOptions } = useIssueResolution(professionals);

  const { save, setEntryStatus, remove } = useAvailabilityEntries(
    () => { setFormOpen(false); setEditing(null); },
    () => setDeleting(null),
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (entry: ProfessionalAvailability) => {
    setEditing(entry);
    setFormOpen(true);
  };

  const showAffected = (entry: ProfessionalAvailability) => {
    setAbsenceFilter({
      id: entry.id,
      label: `${professionalName(entry.professionalId)} · ${validityLabel(entry)}`,
    });
    setIssueStatus('all');
    setTab('issues');
  };

  const { formDefaults, fields } = availabilityFields(professionals, editing, professionalId, tab);

  if (!canRead) {
    return (
      <>
        <PageHeader eyebrow="Planificación" title="Disponibilidad" />
        <ErrorBox message="No tenés permiso para consultar la disponibilidad del equipo." />
      </>
    );
  }

  return (
    <>
      <AvailabilityControls tab={tab} setTab={setTab} canWrite={canWrite}
        activeRegularCount={activeRegularCount} activeAbsenceCount={activeAbsenceCount}
        pendingIssueCount={pendingIssueCount} professionals={professionals}
        professionalId={professionalId} onProfessional={(id) => { setProfessionalId(id); setAbsenceFilter(null); }}
        status={status} setStatus={setStatus} absenceKind={absenceKind} setAbsenceKind={setAbsenceKind}
        issueStatus={issueStatus} setIssueStatus={setIssueStatus}
        regularCount={regularEntries.length} absenceCount={absenceEntries.length} onCreate={openCreate} />

      <RegularPanel tab={tab} entries={regularEntries} availability={availability} canWrite={canWrite}
        professionalName={professionalName} onCreate={openCreate} onEdit={openEdit}
        onToggle={(entry) => setEntryStatus.mutate(entry)} onDelete={setDeleting}
        toggleBusy={setEntryStatus.isPending} />

      <AbsencesPanel tab={tab} entries={absenceEntries} issues={issues.data ?? []}
        availability={availability} canWrite={canWrite} professionalName={professionalName}
        onCreate={openCreate} onEdit={openEdit} onToggle={(entry) => setEntryStatus.mutate(entry)}
        onDelete={setDeleting} onAffected={showAffected} toggleBusy={setEntryStatus.isPending} />

      <IssuesPanel tab={tab} filteredIssues={filteredIssues} issues={issues}
        issueStatus={issueStatus} absenceFilter={absenceFilter} canWrite={canWrite}
        onClearFilter={() => setAbsenceFilter(null)} onResolve={openResolution} />

      <EntityFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar disponibilidad' : 'Nuevo registro de disponibilidad'}
        description={
          editing
            ? `Profesional: ${professionalName(editing.professionalId)}. El vínculo con el profesional no se modifica.`
            : 'Los horarios habituales se repiten semanalmente. Las ausencias y bloqueos aplican al período indicado.'
        }
        schema={availabilityFormSchema}
        defaultValues={formDefaults}
        fields={fields}
        submitLabel={editing ? 'Guardar cambios' : 'Guardar registro'}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values: values as AvailabilityFormValues })
        }
        busy={save.isPending}
        error={save.isError ? errorMessage(save.error) : undefined}
        size="wide"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar registro de disponibilidad"
        description={
          deleting
            ? deleting.kind === 'regular'
              ? 'El bloque habitual dejará de usarse en la detección de disponibilidad. Las jornadas ya planificadas no se modifican.'
              : 'Las afectaciones pendientes de esta ausencia se eliminarán. Las jornadas ya programadas no se modifican automáticamente.'
            : ''
        }
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
        }}
      />

      <ResolutionModal resolving={resolving} onClose={closeResolution} busy={resolveIssue.isPending}
        onSubmit={(issue) => resolveIssue.mutate(issue)} resolveAction={resolveAction}
        setResolveAction={setResolveAction} replacementId={replacementId} setReplacementId={setReplacementId}
        replacementOptions={replacementOptions} rescheduleDate={rescheduleDate} setRescheduleDate={setRescheduleDate}
        rescheduleStart={rescheduleStart} setRescheduleStart={setRescheduleStart}
        resolveReason={resolveReason} setResolveReason={setResolveReason}
        resolveError={resolveError} setResolveError={setResolveError} />

      <p className="tiny muted" style={{ marginTop: 14 }}>
        Las afectaciones se generan al registrar una ausencia activa y se recalculan al modificarla.
        Las resueltas o desestimadas conservan su historial.{' '}
        {issues.dataUpdatedAt
          ? `Última lectura: ${formatIsoDateTime(new Date(issues.dataUpdatedAt).toISOString())}.`
          : null}
      </p>
    </>
  );
}
