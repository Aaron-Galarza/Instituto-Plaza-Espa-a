'use client';

import { minutesToTime, type GroupOccupancy, type ScheduleConflict } from '@plaza/shared';
import { ErrorBox, LoadingBlock } from '@/components/ui';
import { AlertIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { shortDate } from '@/lib/format';

type QueryState<T> = { data?: T; isLoading: boolean; isError: boolean; error: Error | null };

export function AgendaSidebar({ scope, canWrite, pendingConflicts, conflicts, occupancyQuery, date, onDate, onViewDay, onSelectConflict }: {
  scope: 'all' | 'own'; canWrite: boolean;
  pendingConflicts: QueryState<{ from: string; to: string; conflicts: ScheduleConflict[] }>;
  conflicts: ScheduleConflict[]; occupancyQuery: QueryState<GroupOccupancy[]>; date: string;
  onDate: (date: string) => void; onViewDay: () => void;
  onSelectConflict: (conflict: ScheduleConflict) => void;
}) {
  return (
        <aside className="agenda-side">
          {scope === 'all' && canWrite ? (
            <section className="panel">
              <div className="panel-head">
                <h2>Pendientes próximos 84 días</h2>
                {pendingConflicts.data?.conflicts.length ? (
                  <span className="badge" data-tone="ink">
                    {pendingConflicts.data.conflicts.length}
                  </span>
                ) : null}
              </div>
              <div className="panel-pad">
                {pendingConflicts.isLoading ? (
                  <LoadingBlock rows={2} />
                ) : pendingConflicts.isError ? (
                  <ErrorBox message={errorMessage(pendingConflicts.error)} />
                ) : !pendingConflicts.data?.conflicts.length ? (
                  <p className="small muted" style={{ margin: 0 }}>
                    Sin conflictos bloqueantes pendientes en el horizonte móvil.
                  </p>
                ) : (
                  <div className="conflict-list">
                    {pendingConflicts.data.conflicts.slice(0, 10).map((conflict) => (
                      <button
                        key={conflict.id}
                        type="button"
                        className="conflict-item"
                        style={{
                          background: 'transparent',
                          border: 0,
                          borderBottom: '1px solid var(--line)',
                          textAlign: 'left',
                          padding: '9px 0',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          onDate(conflict.date);
                          onViewDay();
                        }}
                      >
                        <span className="conflict-mark" data-severity="error" />
                        <span className="small">
                          {shortDate(conflict.date)} · {conflict.message}
                        </span>
                      </button>
                    ))}
                    {pendingConflicts.data.conflicts.length > 10 ? (
                      <p className="tiny muted">
                        +{pendingConflicts.data.conflicts.length - 10} pendientes más.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          ) : null}
          <section className="panel">
            <div className="panel-head">
              <h2>Conflictos del período</h2>
              {conflicts.length > 0 ? (
                <span className="badge" data-tone="ink">
                  {conflicts.length}
                </span>
              ) : null}
            </div>
            <div className="panel-pad">
              {conflicts.length === 0 ? (
                <p className="small muted" style={{ margin: 0 }}>
                  No se detectaron conflictos en el rango consultado.
                </p>
              ) : (
                <div className="conflict-list">
                  {conflicts.slice(0, 8).map((conflict) => (
                    <button
                      key={conflict.id}
                      type="button"
                      className="conflict-item"
                      style={{
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--line)',
                        textAlign: 'left',
                        padding: '9px 0',
                        cursor: 'pointer',
                      }}
                      onClick={() => onSelectConflict(conflict)}
                    >
                      <span className="conflict-mark" data-severity={conflict.severity} />
                      <span style={{ flex: 1 }}>
                        <span className="row gap-6" style={{ marginBottom: 2 }}>
                          <AlertIcon style={{ width: 13, height: 13 }} />
                          <span className="tiny" style={{ fontWeight: 600 }}>
                            {conflict.severity === 'error' ? 'Bloqueante' : 'Advertencia'} ·{' '}
                            {shortDate(conflict.date)}
                          </span>
                        </span>
                        <span className="small" style={{ display: 'block' }}>
                          {conflict.message}
                        </span>
                      </span>
                    </button>
                  ))}
                  {conflicts.length > 8 ? (
                    <p className="tiny muted" style={{ margin: '8px 0 0' }}>
                      +{conflicts.length - 8} conflictos más en el período.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Ocupación de grupos</h2>
              <span className="tiny muted">{shortDate(date)}</span>
            </div>
            <div className="panel-pad">
              {occupancyQuery.isLoading ? (
                <LoadingBlock rows={2} />
              ) : occupancyQuery.isError ? (
                <p className="small muted" style={{ margin: 0 }}>
                  No se pudo leer la ocupación.
                </p>
              ) : (occupancyQuery.data ?? []).length === 0 ? (
                <p className="small muted" style={{ margin: 0 }}>
                  Sin grupos con jornadas en esta fecha.
                </p>
              ) : (
                <div className="stack gap-12">
                  {(occupancyQuery.data ?? []).map((group) => {
                    const pct =
                      group.capacity > 0
                        ? Math.round((group.maxSimultaneous / group.capacity) * 100)
                        : 0;
                    return (
                      <div key={group.groupId}>
                        <div className="spread" style={{ marginBottom: 4 }}>
                          <span className="small" style={{ fontWeight: 600 }}>
                            {group.groupName}
                          </span>
                          <span className="tiny muted tabular">
                            {group.maxSimultaneous}/{group.capacity}
                          </span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              background: pct >= 100 ? 'var(--ink)' : undefined,
                            }}
                          />
                        </div>
                        <p className="tiny muted" style={{ margin: '4px 0 0' }}>
                          {group.patientIds.length} paciente
                          {group.patientIds.length === 1 ? '' : 's'} ·{' '}
                          {minutesToTime(group.startMinute)}–{minutesToTime(group.endMinute)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Lectura de la agenda</h2>
            </div>
            <div className="panel-pad">
              <p className="small muted" style={{ margin: 0 }}>
                La agenda muestra jornadas expandidas desde las recurrencias semanales. Las
                excepciones, ausencias y solicitudes pendientes se reflejan en el mismo lugar.
              </p>
            </div>
          </section>
        </aside>
  );
}
