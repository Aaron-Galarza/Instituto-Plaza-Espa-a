import { AUDIT_ACTION_LABELS, type AuditEvent, type PaginatedResult, type ScheduleResponse, type ScheduleRuleDetail } from '@plaza/shared';
import { ErrorBox, LoadingBlock } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { dateLabel, shortDate, timeRange } from '@/lib/format';

type QueryState<T> = { data?: T; isLoading: boolean; isError: boolean; error: Error | null };

export function OccurrenceHistory({ patientWeek, patientAudit, detail, canWrite }: {
  patientWeek: QueryState<ScheduleResponse>; patientAudit: QueryState<PaginatedResult<AuditEvent>>;
  detail: QueryState<ScheduleRuleDetail>; canWrite: boolean;
}) {
  return (
    <>
          <section>
            <h3 className="section-title">Semana del paciente</h3>
            {patientWeek.isLoading ? <LoadingBlock rows={2} /> : null}
            {patientWeek.isError ? <ErrorBox message={errorMessage(patientWeek.error)} /> : null}
            {patientWeek.data?.occurrences.length ? (
              <ul className="plain-list">
                {patientWeek.data.occurrences.map((item) => (
                  <li key={item.key}>
                    {shortDate(item.date)} · {timeRange(item.startMinute, item.endMinute)} ·{' '}
                    {item.segments.map((segment) => segment.serviceName).join(' / ')}
                  </li>
                ))}
              </ul>
            ) : !patientWeek.isLoading && !patientWeek.isError ? (
              <p className="small muted">Sin otras jornadas en esta semana.</p>
            ) : null}
          </section>

          {canWrite ? (
            <section>
              <h3 className="section-title">Historial administrativo del paciente</h3>
              {patientAudit.isLoading ? <LoadingBlock rows={2} /> : null}
              {patientAudit.isError ? (
                <ErrorBox message={errorMessage(patientAudit.error)} />
              ) : null}
              {patientAudit.data?.items.length ? (
                <ul className="plain-list">
                  {patientAudit.data.items.map((event) => (
                    <li key={event.id}>
                      {shortDate(event.at.slice(0, 10))} ·{' '}
                      {AUDIT_ACTION_LABELS[event.action] ?? event.action} · {event.actorName}
                    </li>
                  ))}
                </ul>
              ) : !patientAudit.isLoading && !patientAudit.isError ? (
                <p className="small muted">Sin cambios administrativos registrados.</p>
              ) : null}
            </section>
          ) : null}

          {detail.isLoading ? <LoadingBlock rows={3} /> : null}
          {detail.isError ? <ErrorBox message={errorMessage(detail.error)} /> : null}

          {detail.data?.exceptions.length ? (
            <section>
              <h3 className="section-title">Excepciones de la serie</h3>
              <div className="series-list">
                {detail.data.exceptions.map((exception) => (
                  <div className="series-item" key={exception.id}>
                    <span
                      className="badge"
                      data-tone={exception.type === 'cancelled' ? 'mist' : 'blue'}
                    >
                      {exception.type === 'cancelled' ? 'Cancelada' : 'Modificada'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong>{dateLabel(exception.date)}</strong>
                      {exception.startMinute !== null && exception.startMinute !== undefined ? (
                        <span className="tiny muted tabular" style={{ display: 'block' }}>
                          {timeRange(
                            exception.startMinute,
                            exception.endMinute ?? exception.startMinute,
                          )}
                        </span>
                      ) : null}
                      {exception.reason ? (
                        <span className="tiny muted" style={{ display: 'block' }}>
                          {exception.reason}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {detail.data?.warnings.length ? (
            <section>
              <h3 className="section-title">Advertencias</h3>
              <div className="conflict-list">
                {detail.data.warnings.map((warning) => (
                  <div className="conflict-item" key={warning.id}>
                    <span className="conflict-mark" data-severity="warning" />
                    <div>{warning.message}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

    </>
  );
}
