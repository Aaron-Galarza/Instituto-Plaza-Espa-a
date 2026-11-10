'use client';

import type { Professional } from '@plaza/shared';
import { Button, Field, PageHeader, Select } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import type { Tab, IssueStatusFilter } from './availability-form';

export function AvailabilityControls({ tab, setTab, canWrite, activeRegularCount, activeAbsenceCount, pendingIssueCount, professionals, professionalId, onProfessional, status, setStatus, absenceKind, setAbsenceKind, issueStatus, setIssueStatus, regularCount, absenceCount, onCreate }: {
  tab: Tab; setTab: (value: Tab) => void; canWrite: boolean; activeRegularCount: number; activeAbsenceCount: number; pendingIssueCount: number;
  professionals: Professional[]; professionalId: string; onProfessional: (id: string) => void; status: string; setStatus: (value: string) => void;
  absenceKind: string; setAbsenceKind: (value: string) => void; issueStatus: IssueStatusFilter; setIssueStatus: (value: IssueStatusFilter) => void;
  regularCount: number; absenceCount: number; onCreate: () => void;
}) {
  const regularEntries = { length: regularCount };
  const absenceEntries = { length: absenceCount };
  return (
    <>
      <PageHeader
        eyebrow="Planificación"
        title="Disponibilidad"
        lede="Horarios habituales, ausencias y bloqueos del equipo. Las ausencias se cruzan con la agenda para señalar las jornadas que necesitan resolución."
        actions={
          canWrite && tab !== 'issues' ? (
            <Button variant="primary" onClick={onCreate}>
              <PlusIcon /> {tab === 'absences' ? 'Registrar ausencia' : 'Nuevo horario'}
            </Button>
          ) : null
        }
      />

      <div className="metric-grid" style={{ marginBottom: 18 }}>
        <div className="metric">
          <strong>{activeRegularCount}</strong>
          <span>Bloques habituales activos</span>
        </div>
        <div className="metric">
          <strong>{activeAbsenceCount}</strong>
          <span>Ausencias y bloqueos activos</span>
        </div>
        <div className="metric" data-accent={pendingIssueCount > 0}>
          <strong>{pendingIssueCount}</strong>
          <span>Afectaciones pendientes</span>
        </div>
        <div className="metric">
          <strong>
            {professionals.filter((professional) => professional.status === 'active').length}
          </strong>
          <span>Profesionales activos</span>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filtros de disponibilidad">
        {canWrite ? (
          <Field label="Profesional">
            <Select
              value={professionalId}
              onChange={(event) => {
                onProfessional(event.target.value);
              }}
            >
              <option value="">Todo el equipo</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.firstName} {professional.lastName}
                  {professional.status === 'inactive' ? ' (inactivo)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Estado">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>
        </Field>
        {tab === 'absences' ? (
          <Field label="Tipo">
            <Select value={absenceKind} onChange={(event) => setAbsenceKind(event.target.value)}>
              <option value="">Ausencias y bloqueos</option>
              <option value="absence">Sólo ausencias</option>
              <option value="block">Sólo bloqueos</option>
            </Select>
          </Field>
        ) : null}
      {tab === 'issues' ? (
          <Field label="Estado de afectación">
            <Select
              value={issueStatus}
              onChange={(event) => setIssueStatus(event.target.value as IssueStatusFilter)}
            >
              <option value="pending">Pendientes</option>
              <option value="resolved">Resueltas</option>
              <option value="dismissed">Desestimadas</option>
              <option value="all">Todas</option>
            </Select>
          </Field>
        ) : null}
      </div>

      <div className="tabs" role="tablist" aria-label="Secciones de disponibilidad">
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === 'regular'}
          aria-selected={tab === 'regular'}
          onClick={() => setTab('regular')}
        >
          Horarios habituales
          <span className="tab-count tabular">{regularEntries.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === 'absences'}
          aria-selected={tab === 'absences'}
          onClick={() => setTab('absences')}
        >
          Ausencias y bloqueos
          <span className="tab-count tabular">{absenceEntries.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === 'issues'}
          aria-selected={tab === 'issues'}
          onClick={() => setTab('issues')}
        >
          Afectaciones
          <span className="tab-count tabular" data-alert={pendingIssueCount > 0}>
            {pendingIssueCount}
          </span>
        </button>
      </div>

    </>
  );
}
