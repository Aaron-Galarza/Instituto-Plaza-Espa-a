'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AUDIT_ACTION_LABELS,
  type AuditEvent,
  type PaginatedResult,
} from '@plaza/shared';
import {
  Button,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api, errorMessage, queryString } from '@/lib/api';
import { AuditResults } from './audit-results';

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'patient', label: 'Pacientes' },
  { value: 'professional', label: 'Profesionales' },
  { value: 'professionalAvailability', label: 'Disponibilidad' },
  { value: 'assignmentIssue', label: 'Afectaciones' },
  { value: 'insurer', label: 'Obras sociales' },
  { value: 'service', label: 'Prestaciones' },
  { value: 'space', label: 'Espacios' },
  { value: 'careGroup', label: 'Grupos' },
  { value: 'scheduleRule', label: 'Recurrencias' },
  { value: 'scheduleException', label: 'Excepciones' },
  { value: 'changeRequest', label: 'Solicitudes' },
  { value: 'user', label: 'Usuarios' },
];

export default function AuditPage() {
  const { can } = useAuth();
  const canRead = can('audit:read');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const events = useQuery<PaginatedResult<AuditEvent>>({
    queryKey: ['audit', page, entity, action, from, to],
    queryFn: () =>
      api<PaginatedResult<AuditEvent>>(
        `/audit${queryString({ page, pageSize: 40, entity, action, from, to })}`,
      ),
    enabled: canRead,
  });

  if (!canRead) {
    return (
      <>
        <PageHeader eyebrow="Administración" title="Auditoría" />
        <ErrorBox message="No tenés permisos para consultar la auditoría." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Auditoría"
        lede="Registro de operaciones del sistema, ordenado de la más reciente a la más antigua."
      />

      <div className="filters" role="group" aria-label="Filtros de auditoría">
        <Field label="Entidad">
          <Select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
          >
            {ENTITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Acción">
          <Select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las acciones</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Desde">
          <Input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </Field>
        <Field label="Hasta">
          <Input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </Field>
        <div className="stack" style={{ justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            onClick={() => {
              setEntity('');
              setAction('');
              setFrom('');
              setTo('');
              setPage(1);
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Eventos</h2>
          <span className="tiny muted tabular">{events.data?.total ?? 0} registros</span>
        </div>
        {events.isLoading ? (
          <div className="panel-pad">
            <LoadingBlock rows={6} />
          </div>
        ) : events.isError ? (
          <div className="panel-pad">
            <ErrorBox message={errorMessage(events.error)} />
          </div>
        ) : (events.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin eventos"
            description="No hay operaciones registradas para los filtros elegidos."
          />
        ) : (
          <AuditResults data={events.data!} onPage={setPage} />
        )}
      </div>
    </>
  );
}
