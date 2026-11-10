'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDuration, type DashboardResponse } from '@plaza/shared';
import { ErrorBox, LoadingBlock, PageHeader, Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useReferenceData } from '@/lib/queries';
import { api, errorMessage, queryString } from '@/lib/api';
import { monthRange, today } from '@/lib/format';
import { DashboardMetrics } from './dashboard-metrics';
import { DashboardControls } from './dashboard-controls';
import { DashboardActivity } from './dashboard-activity';
import { DashboardAlerts } from './dashboard-alerts';

export default function DashboardPage() {
  const { can } = useAuth();
  const reference = useReferenceData();
  const canRead = can('dashboard:read');
  const initial = useMemo(() => monthRange(today()), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const dashboard = useQuery<DashboardResponse>({
    queryKey: ['dashboard', from, to],
    queryFn: () => api<DashboardResponse>(`/dashboard${queryString({ from, to })}`),
    enabled: canRead && Boolean(from && to && from <= to),
  });

  if (!canRead) {
    return (
      <>
        <PageHeader eyebrow="Dirección" title="Tablero" />
        <ErrorBox message="El tablero global está disponible para el rol de dirección." />
      </>
    );
  }

  const data = dashboard.data;
  const patientName = (id: string | undefined) => {
    const patient = reference.data?.patients.find((item) => item.id === id);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente';
  };
  const professionalName = (id: string) => {
    const professional = reference.data?.professionals.find((item) => item.id === id);
    return professional ? `${professional.firstName} ${professional.lastName}` : 'Profesional';
  };

  return (
    <>
      <DashboardControls from={from} to={to} setFrom={setFrom} setTo={setTo} />

      {from > to ? (
        <ErrorBox message="La fecha desde no puede ser posterior a la fecha hasta." />
      ) : dashboard.isLoading ? (
        <LoadingBlock rows={8} />
      ) : dashboard.isError ? (
        <ErrorBox message={errorMessage(dashboard.error)} />
      ) : data ? (
        <div className="stack gap-16">
          <DashboardMetrics metrics={data.metrics} />

          <DashboardActivity data={data} from={from} to={to} />

          <div className="dash-grid">
            <Panel title="Profesionales" bodyClassName="">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Profesional</th>
                      <th>Tramos</th>
                      <th>Pacientes</th>
                      <th>Minutos agendados</th>
                      <th>Utilización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProfessional.map((row) => (
                      <tr key={row.professionalId}>
                        <td>
                          <div className="row gap-6">
                            <span className="dot" style={{ color: row.color }} aria-hidden="true" />
                            <a
                              className="row-title"
                              href={`/agenda?date=${from}&view=${from === to ? 'day' : 'month'}&professionalId=${row.professionalId}`}
                            >
                              {row.name}
                            </a>
                          </div>
                        </td>
                        <td className="tabular">{row.segments}</td>
                        <td className="tabular">{row.patients}</td>
                        <td className="tabular">{formatDuration(row.scheduledMinutes)}</td>
                        <td>
                          {row.utilizationPct === null ? (
                            <span className="tiny muted">Sin disponibilidad</span>
                          ) : (
                            <div className="row gap-6">
                              <div className="bar-track" style={{ flex: 1, minWidth: 50 }}>
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${Math.min(100, row.utilizationPct)}%`,
                                    background: row.utilizationPct > 100 ? 'var(--ink)' : undefined,
                                  }}
                                />
                              </div>
                              <span
                                className="tiny tabular"
                                style={{ minWidth: 34, textAlign: 'right' }}
                              >
                                {row.utilizationPct}%
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.byProfessional.length === 0 ? (
                  <p className="small muted" style={{ padding: 16, margin: 0 }}>
                    Sin profesionales con agenda en el período.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel title="Obras sociales">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Obra social</th>
                      <th>Pacientes</th>
                      <th>Jornadas</th>
                      <th>Prestaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byInsurer.map((row) => (
                      <tr key={row.insurerId ?? 'none'}>
                        <td>{row.name}</td>
                        <td className="tabular">{row.patients}</td>
                        <td className="tabular">{row.journeys}</td>
                        <td className="tabular">{row.services}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <DashboardAlerts data={data} from={from} to={to}
            patientName={patientName} professionalName={professionalName} />
        </div>
      ) : null}
    </>
  );
}
