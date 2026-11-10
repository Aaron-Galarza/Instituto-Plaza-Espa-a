'use client';

import { WEEKDAY_LABELS, type ProfessionalAvailability } from '@plaza/shared';
import { Badge, Button, EmptyState, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { timeRange } from '@/lib/format';
import { countLabel, validityLabel, type Tab } from './availability-form';

type QueryState = { isLoading: boolean; isError: boolean; error: Error | null; refetch: () => unknown };

export function RegularPanel({ tab, entries: regularEntries, availability, canWrite, professionalName, onCreate, onEdit, onToggle, onDelete, toggleBusy }: {
  tab: Tab; entries: ProfessionalAvailability[]; availability: QueryState; canWrite: boolean;
  professionalName: (id: string) => string; onCreate: () => void; onEdit: (entry: ProfessionalAvailability) => void;
  onToggle: (entry: ProfessionalAvailability) => void; onDelete: (entry: ProfessionalAvailability) => void; toggleBusy: boolean;
}) {
  return (
    <>
      {tab === 'regular' ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Horarios habituales</h2>
            <span className="tiny muted">
              {countLabel(regularEntries.length, 'bloque', 'bloques')}
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
          ) : regularEntries.length === 0 ? (
            <EmptyState
              title="Sin horarios habituales"
              description="Los horarios habituales definen la cobertura semanal del equipo y alimentan la detección de conflictos."
              action={
                canWrite ? (
                  <Button size="sm" onClick={onCreate}>
                    <PlusIcon /> Nuevo horario
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
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    <th>Notas</th>
                    {canWrite ? <th aria-label="Acciones" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {regularEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="row-title">{professionalName(entry.professionalId)}</td>
                      <td>
                        <Badge tone="mist">
                          {entry.dayOfWeek ? WEEKDAY_LABELS[entry.dayOfWeek] : '—'}
                        </Badge>
                      </td>
                      <td className="tabular">{timeRange(entry.startMinute, entry.endMinute)}</td>
                      <td className="small">{validityLabel(entry)}</td>
                      <td>
                        <StatusBadge status={entry.status} />
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

    </>
  );
}
