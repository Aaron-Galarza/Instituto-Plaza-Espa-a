'use client';

import { AVAILABILITY_KIND_LABELS, type AssignmentIssueDetail, type ProfessionalAvailability } from '@plaza/shared';
import { Badge, Button, EmptyState, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { timeRange } from '@/lib/format';
import { countLabel, validityLabel, type Tab } from './availability-form';

type QueryState = { isLoading: boolean; isError: boolean; error: Error | null; refetch: () => unknown };

export function AbsencesPanel({ tab, entries: absenceEntries, issues, availability, canWrite, professionalName, onCreate, onEdit, onToggle, onDelete, onAffected, toggleBusy }: {
  tab: Tab; entries: ProfessionalAvailability[]; issues: AssignmentIssueDetail[]; availability: QueryState; canWrite: boolean;
  professionalName: (id: string) => string; onCreate: () => void; onEdit: (entry: ProfessionalAvailability) => void;
  onToggle: (entry: ProfessionalAvailability) => void; onDelete: (entry: ProfessionalAvailability) => void;
  onAffected: (entry: ProfessionalAvailability) => void; toggleBusy: boolean;
}) {
  return (
    <>
      {tab === 'absences' ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Ausencias y bloqueos</h2>
            <span className="tiny muted">
              {countLabel(absenceEntries.length, 'registro', 'registros')}
            </span>
          </div>
          {availability.isLoading ? (
            <div className="panel-pad">
              <LoadingBlock rows={5} />
            </div>
          ) : availability.isError ? (
            <div className="panel-pad">
              <ErrorBox message={errorMessage(availability.error)} />
              <Button size="sm" onClick={() => void availability.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : absenceEntries.length === 0 ? (
            <EmptyState
              title="Sin ausencias registradas"
              description="Registrá ausencias o bloqueos para que el sistema detecte las jornadas que requieren reasignación o cancelación."
              action={
                canWrite ? (
                  <Button size="sm" onClick={onCreate}>
                    <PlusIcon /> Registrar ausencia
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Profesional</th>
                    <th>Tipo</th>
                    <th>Período</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th>Afectaciones</th>
                    <th>Notas</th>
                    {canWrite ? <th aria-label="Acciones" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {absenceEntries.map((entry) => {
                    const affected = issues.filter(
                      (issue) => issue.absenceId === entry.id,
                    );
                    const pending = affected.filter((issue) => issue.status === 'pending').length;
                    return (
                      <tr key={entry.id}>
                        <td className="row-title">{professionalName(entry.professionalId)}</td>
                        <td>
                          <Badge tone={entry.kind === 'absence' ? 'blue' : 'mist'}>
                            {AVAILABILITY_KIND_LABELS[entry.kind]}
                          </Badge>
                        </td>
                        <td className="small">{validityLabel(entry)}</td>
                        <td className="tabular">{timeRange(entry.startMinute, entry.endMinute)}</td>
                        <td>
                          <StatusBadge status={entry.status} />
                        </td>
                        <td>
                          {affected.length === 0 ? (
                            <span className="tiny muted">Sin afectaciones</span>
                          ) : (
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => onAffected(entry)}
                            >
                              {countLabel(affected.length, 'afectación', 'afectaciones')}
                              {pending > 0
                                ? ` · ${pending} pendiente${pending === 1 ? '' : 's'}`
                                : ''}
                            </button>
                          )}
                        </td>
                        <td className="small muted">{entry.notes || '—'}</td>
                        {canWrite ? (
                          <td>
                            <div
                              className="row gap-4"
                              style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}
                            >
                              <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}>
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onToggle(entry)}
                                disabled={toggleBusy}
                              >
                                {entry.status === 'active' ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => onDelete(entry)}>
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

    </>
  );
}
