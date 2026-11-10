import { formatDuration, type DashboardResponse } from '@plaza/shared';
import { Badge, Panel } from '@/components/ui';
import { shortDate } from '@/lib/format';

export function DashboardAlerts({ data, from, to, patientName, professionalName }: {
  data: DashboardResponse; from: string; to: string;
  patientName: (id: string | undefined) => string; professionalName: (id: string) => string;
}) {
  return (
          <div className="dash-grid">
            <Panel title="Espacios">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Espacio</th>
                      <th>Capacidad</th>
                      <th>Máx. simultáneo</th>
                      <th>Pico</th>
                      <th>Días usados</th>
                      <th>Minutos de paciente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySpace.map((row) => (
                      <tr key={row.spaceId}>
                        <td className="row-title">
                          <a
                            href={`/agenda?date=${from}&view=${from === to ? 'day' : 'month'}&spaceId=${row.spaceId}`}
                          >
                            {row.name}
                          </a>
                        </td>
                        <td className="tabular">{row.capacity}</td>
                        <td className="tabular">{row.maxSimultaneous}</td>
                        <td>
                          <Badge tone={row.peakUtilizationPct > 100 ? 'ink' : 'mist'}>
                            {row.peakUtilizationPct}%
                          </Badge>
                        </td>
                        <td className="tabular">{row.daysUsed}</td>
                        <td className="tabular">{formatDuration(row.patientMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.bySpace.length === 0 ? (
                  <p className="small muted" style={{ padding: 16, margin: 0 }}>
                    Sin uso de espacios en el período.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel title="Conflictos y afectaciones">
              <div className="stack gap-16">
                <div>
                  <h3 className="tiny muted" style={{ margin: '0 0 6px', fontWeight: 600 }}>
                    Conflictos de agenda ({data.conflicts.length})
                  </h3>
                  {data.conflicts.length === 0 ? (
                    <p className="small muted" style={{ margin: 0 }}>
                      Sin conflictos detectados.
                    </p>
                  ) : (
                    <div className="conflict-list">
                      {data.conflicts.slice(0, 6).map((conflict) => (
                        <div className="conflict-item" key={conflict.id}>
                          <span className="conflict-mark" data-severity={conflict.severity} />
                          <div>
                            <div className="tiny" style={{ fontWeight: 600 }}>
                              {conflict.severity === 'error' ? 'Bloqueante' : 'Advertencia'} ·{' '}
                              {shortDate(conflict.date)}
                            </div>
                            <div className="small">{conflict.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="tiny muted" style={{ margin: '0 0 6px', fontWeight: 600 }}>
                    Afectaciones pendientes ({data.pendingIssues.length})
                  </h3>
                  {data.pendingIssues.length === 0 ? (
                    <p className="small muted" style={{ margin: 0 }}>
                      Sin afectaciones por resolver.
                    </p>
                  ) : (
                    <div className="conflict-list">
                      {data.pendingIssues.slice(0, 6).map((issue) => (
                        <div className="conflict-item" key={issue.id}>
                          <span className="conflict-mark" data-severity="warning" />
                          <div>
                            <div className="tiny" style={{ fontWeight: 600 }}>
                              {shortDate(issue.date)}
                            </div>
                            <div className="small">
                              {patientName(issue.patientIds[0])} ·{' '}
                              {professionalName(issue.professionalId)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </div>
  );
}
