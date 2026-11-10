'use client';

import type { Professional, PaginatedResult } from '@plaza/shared';
import { Badge, Button, IconButton, Pagination, PersonCell, StatusBadge } from '@/components/ui';
import { EditIcon, TrashIcon } from '@/components/icons';

export function ProfessionalsTable({ data, canWrite, linkedUserName, onView, onEdit, onToggle, onDelete, toggleBusy, onPage }: {
  data: PaginatedResult<Professional>; canWrite: boolean; linkedUserName: (id: string | null | undefined) => string;
  onView: (id: string) => void; onEdit: (item: Professional) => void; onToggle: (item: Professional) => void;
  onDelete: (item: Professional) => void; toggleBusy: boolean; onPage: (page: number) => void;
}) {
  return (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Profesional</th>
                    <th>Especialidades</th>
                    <th>Contacto</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    {canWrite ? <th aria-label="Acciones" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((professional) => (
                    <tr key={professional.id}>
                      <td>
                        <div className="row gap-8">
                          <span
                            className="dot"
                            style={{ color: professional.color, width: 10, height: 10 }}
                            aria-hidden="true"
                          />
                          <button
                            className="text-link"
                            type="button"
                            onClick={() => onView(professional.id)}
                          >
                            <PersonCell
                              name={`${professional.lastName}, ${professional.firstName}`}
                              detail={professional.phone ?? undefined}
                            />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                          {professional.specialties.map((specialty) => (
                            <Badge key={specialty} tone="mist">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>{professional.email ?? '—'}</td>
                      <td>{linkedUserName(professional.userId)}</td>
                      <td>
                        <StatusBadge status={professional.status} />
                      </td>
                      {canWrite ? (
                        <td>
                          <div className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                            <IconButton
                              label={`Editar ${professional.firstName} ${professional.lastName}`}
                              onClick={() => onEdit(professional)}
                            >
                              <EditIcon />
                            </IconButton>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onToggle(professional)}
                              disabled={toggleBusy}
                            >
                              {professional.status === 'active' ? 'Desactivar' : 'Activar'}
                            </Button>
                            <IconButton
                              label={`Eliminar ${professional.firstName} ${professional.lastName}`}
                              onClick={() => onDelete(professional)}
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
