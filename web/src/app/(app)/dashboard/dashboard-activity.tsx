import type { DashboardResponse } from '@plaza/shared';
import { Panel } from '@/components/ui';
import { shortDate } from '@/lib/format';

export function DashboardActivity({ data, from, to }: { data: DashboardResponse; from: string; to: string }) {
  return (
          <div className="dash-grid">
            <Panel title="Jornadas por día" bodyClassName="panel-pad">
              <DailyChart daily={data.daily} />
            </Panel>
            <Panel title="Distribución por prestación">
              <div className="bar-list">
                {data.byService.length === 0 ? (
                  <p className="small muted" style={{ margin: 0 }}>
                    Sin datos en el período.
                  </p>
                ) : (
                  data.byService.slice(0, 8).map((row) => {
                    const max = Math.max(...data.byService.map((item) => item.patientMinutes), 1);
                    return (
                      <div className="bar-row" key={row.serviceId}>
                        <a
                          title={row.name}
                          href={`/agenda?date=${from}&view=${from === to ? 'day' : 'month'}&serviceId=${row.serviceId}`}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.name}
                        </a>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${Math.round((row.patientMinutes / max) * 100)}%` }}
                          />
                        </div>
                        <span className="tiny muted tabular" style={{ textAlign: 'right' }}>
                          {row.patients} pac.
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </div>

  );
}

function DailyChart({ daily }: { daily: DashboardResponse['daily'] }) {
  const max = Math.max(1, ...daily.map((row) => row.journeys));
  if (daily.length === 0) {
    return (
      <p className="small muted" style={{ margin: 0 }}>
        Sin jornadas en el período.
      </p>
    );
  }
  return (
    <div>
      <div className="chart" role="img" aria-label="Jornadas por día en el período seleccionado">
        {daily.map((row) => (
          <div
            key={row.date}
            className="chart-bar"
            data-zero={row.journeys === 0}
            style={{
              height: `${Math.max(row.journeys === 0 ? 2 : 6, Math.round((row.journeys / max) * 100))}%`,
            }}
            title={`${shortDate(row.date)}: ${row.journeys} jornadas, ${row.patients} pacientes, ${row.conflicts} conflictos`}
          />
        ))}
      </div>
      <div className="spread" style={{ marginTop: 6 }}>
        <span className="tiny muted">{shortDate(daily[0]!.date)}</span>
        <span className="tiny muted">Máx. {max} jornadas/día</span>
        <span className="tiny muted">{shortDate(daily[daily.length - 1]!.date)}</span>
      </div>
    </div>
  );
}
