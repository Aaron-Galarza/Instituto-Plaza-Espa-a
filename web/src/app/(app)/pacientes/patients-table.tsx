'use client';

import { TRANSPORT_MODE_LABELS, type Patient, type PaginatedResult } from '@plaza/shared';
import { Button, IconButton, Pagination, PersonCell, StatusBadge } from '@/components/ui';
import { EditIcon, TrashIcon } from '@/components/icons';
import { shortDate } from '@/lib/format';

export function PatientsTable({ data, canWrite, insurerName, onView, onEdit, onToggle, onDelete, toggleBusy, onPage }: {
  data: PaginatedResult<Patient>; canWrite: boolean; insurerName: (id: string | null | undefined) => string;
  onView: (id: string) => void; onEdit: (item: Patient) => void; onToggle: (item: Patient) => void;
  onDelete: (item: Patient) => void; toggleBusy: boolean; onPage: (page: number) => void;
}) {
  return (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Obra social</th>
                    <th>Contacto</th>
                    <th>Nacimiento</th>
                    <th>Traslado</th>
                    <th>Estado</th>
                    {canWrite ? <th aria-label="Acciones" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <button
                          className="text-link"
                          type="button"
                          onClick={() => onView(patient.id)}
                        >
                          <PersonCell
                            name={`${patient.lastName}, ${patient.firstName}`}
                            detail={patient.document ? `Documento ${patient.document}` : undefined}
                          />
                        </button>
                      </td>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <span>{insurerName(patient.insurerId)}</span>
                          {patient.affiliateNumber ? (
                            <span className="tiny muted">Afiliado {patient.affiliateNumber}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <span>{patient.phone ?? '—'}</span>
                          {patient.email ? (
                            <span className="tiny muted">{patient.email}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="tabular">
                        {patient.birthDate ? shortDate(patient.birthDate) : '—'}
                      </td>
                      <td>{TRANSPORT_MODE_LABELS[patient.transportMode]}</td>
                      <td>
                        <StatusBadge status={patient.status} />
                      </td>
                      {canWrite ? (
                        <td>
                          <div className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                            <IconButton
                              label={`Editar ${patient.firstName} ${patient.lastName}`}
                              onClick={() => onEdit(patient)}
                            >
                              <EditIcon />
                            </IconButton>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onToggle(patient)}
                              disabled={toggleBusy}
                            >
                              {patient.status === 'active' ? 'Desactivar' : 'Activar'}
                            </Button>
                            <IconButton
                              label={`Eliminar ${patient.firstName} ${patient.lastName}`}
                              onClick={() => onDelete(patient)}
                            >
                              <TrashIcon />
                            </IconButton>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel-pad">
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPage={onPage}
              />
            </div>
          </>
  );
}
