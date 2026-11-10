'use client';

import { ROLE_LABELS, formatIsoDateTime, type User, type PaginatedResult } from '@plaza/shared';
import { Badge, Button, IconButton, Pagination, StatusBadge } from '@/components/ui';
import { EditIcon, LockIcon } from '@/components/icons';

export function UsersTable({ data, sessionUserId, professionalName, onEdit, onReset, onToggle, toggleBusy, onPage }: {
  data: PaginatedResult<User>; sessionUserId?: string; professionalName: (id: string | null | undefined) => string;
  onEdit: (item: User) => void; onReset: (item: User) => void; onToggle: (item: User) => void;
  toggleBusy: boolean; onPage: (page: number) => void;
}) {
  return (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Profesional</th>
                    <th>Último ingreso</th>
                    <th>Estado</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((target) => (
                    <tr key={target.id}>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <span className="row-title">
                            {target.name}
                            {target.id === sessionUserId ? (
                              <span className="tiny muted" style={{ marginLeft: 6 }}>
                                (vos)
                              </span>
                            ) : null}
                          </span>
                          <span className="tiny muted">{target.email}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={target.role === 'director' ? 'blue' : 'mist'}>
                          {ROLE_LABELS[target.role]}
                        </Badge>
                      </td>
                      <td>{professionalName(target.professionalId)}</td>
                      <td className="tabular">
                        {target.lastLoginAt ? formatIsoDateTime(target.lastLoginAt) : '—'}
                      </td>
                      <td>
                        <StatusBadge status={target.status} />
                      </td>
                      <td>
                        <div className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                          <IconButton
                            label={`Editar ${target.name}`}
                            onClick={() => onEdit(target)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            label={`Restablecer contraseña de ${target.name}`}
                            onClick={() => onReset(target)}
                          >
                            <LockIcon />
                          </IconButton>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggle(target)}
                            disabled={toggleBusy || target.id === sessionUserId}
                            title={
                              target.id === sessionUserId
                                ? 'No podés desactivar tu propia cuenta.'
                                : undefined
                            }
                          >
                            {target.status === 'active' ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
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
