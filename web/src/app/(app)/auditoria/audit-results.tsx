'use client';

import { AUDIT_ACTION_LABELS, formatIsoDateTime, type AuditEvent, type PaginatedResult } from '@plaza/shared';
import { Badge, Pagination } from '@/components/ui';

export function AuditResults({ data, onPage }: { data: PaginatedResult<AuditEvent>; onPage: (page: number) => void }) {
  return (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Persona</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((event) => (
                    <tr key={event.id}>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        {formatIsoDateTime(event.at)}
                      </td>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <span>{event.actorName}</span>
                          <span className="tiny muted">{event.actorRole}</span>
                        </div>
                      </td>
                      <td>{AUDIT_ACTION_LABELS[event.action] ?? event.action}</td>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <Badge tone="mist">{event.entity}</Badge>
                          <span
                            className="tiny muted"
                            style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {event.entityId}
                          </span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 360 }}>
                        {Object.keys(event.metadata).length === 0 ? (
                          <span className="tiny muted">—</span>
                        ) : (
                          <details>
                            <summary
                              className="tiny"
                              style={{ cursor: 'pointer', color: 'var(--blue)' }}
                            >
                              Ver datos
                            </summary>
                            <pre
                              className="tiny"
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                margin: '6px 0 0',
                                padding: 8,
                                background: 'var(--mist)',
                                fontFamily: 'ui-monospace, monospace',
                              }}
                            >
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
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
