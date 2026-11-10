import { formatDuration, type DashboardResponse } from '@plaza/shared';

export function DashboardMetrics({ metrics }: { metrics: DashboardResponse['metrics'] }) {
  const data = { metrics };
  return (
    <>
          <div className="metric-grid">
            <Metric
              label="Pacientes únicos"
              value={data.metrics.uniquePatients}
              href="/pacientes"
              accent
            />
            <Metric label="Jornadas activas" value={data.metrics.journeys} href="/agenda" />
            <Metric label="Tramos de prestación" value={data.metrics.services} />
            <Metric
              label="Profesionales con agenda"
              value={data.metrics.professionalsWithAssignments}
              href="/profesionales"
            />
            <Metric
              label="Minutos de paciente"
              value={formatDuration(data.metrics.patientMinutes)}
            />
            <Metric
              label="Minutos profesionales"
              value={formatDuration(data.metrics.professionalMinutes)}
            />
            <Metric
              label="Disponibilidad cargada"
              value={formatDuration(data.metrics.availableProfessionalMinutes)}
              href="/disponibilidad"
            />
            <Metric
              label="Máx. pacientes simultáneos"
              value={data.metrics.maxSimultaneousPatients}
            />
          </div>

          <div className="metric-grid">
            <Metric
              label="Pacientes con más de una prestación"
              value={data.metrics.patientsWithMultipleServices}
            />
            <Metric
              label="Tramos sin profesional"
              value={data.metrics.segmentsWithoutProfessional}
            />
            <Metric
              label="Conflictos pendientes"
              value={data.metrics.pendingConflicts}
              href="/agenda"
            />
            <Metric
              label="Solicitudes pendientes"
              value={data.metrics.pendingRequests}
              href="/solicitudes"
            />
            <Metric
              label="Cambios de agenda"
              value={data.metrics.scheduleChanges}
              href="/auditoria"
            />
            <Metric label="Jornadas canceladas" value={data.metrics.cancelledOccurrences} />
            <Metric
              label="Afectaciones por resolver"
              value={data.metrics.pendingIssues}
              href="/disponibilidad"
            />
          </div>

    </>
  );
}

function Metric({
  label,
  value,
  href,
  accent = false,
}: {
  label: string;
  value: string | number;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <>
      <strong>{value}</strong>
      <span>{label}</span>
    </>
  );
  return href ? (
    <a
      className="metric"
      data-accent={accent}
      href={href}
      aria-label={`${label}: ${value}. Ver registros relacionados`}
    >
      {content}
    </a>
  ) : (
    <div className="metric" data-accent={accent}>
      {content}
    </div>
  );
}
