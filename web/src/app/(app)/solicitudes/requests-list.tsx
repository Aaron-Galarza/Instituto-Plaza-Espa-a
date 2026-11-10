import { CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_TYPE_LABELS, formatIsoDateTime, type ChangeRequest, type PaginatedResult } from '@plaza/shared';
import { Button, EmptyState, ErrorBox, LoadingBlock, Pagination, StatusBadge } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { shortDate, timeRange } from '@/lib/format';
import type { StatusTab } from './request-controls';

interface Props {
  status: StatusTab;
  data?: PaginatedResult<ChangeRequest>;
  isLoading: boolean;
  error: Error | null;
  onSelect: (id: string) => void;
  onPage: (page: number) => void;
}

export function RequestsList({ status, data, isLoading, error, onSelect, onPage }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{status === 'all' ? 'Todas las solicitudes' : `Solicitudes ${CHANGE_REQUEST_STATUS_LABELS[status].toLowerCase()}`}</h2>
        <span className="tiny muted tabular">{data?.total ?? 0} registros</span>
      </div>
      {isLoading ? (
        <div className="panel-pad"><LoadingBlock rows={5} /></div>
      ) : error ? (
        <div className="panel-pad"><ErrorBox message={errorMessage(error)} /></div>
      ) : !data?.items.length ? (
        <EmptyState title="Sin solicitudes" description={status === 'pending' ? 'No hay solicitudes pendientes de resolución con los filtros elegidos.' : 'No hay solicitudes que coincidan con los filtros elegidos.'} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tipo</th><th>Fecha propuesta</th><th>Solicitante</th><th>Motivo</th><th>Creada</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {data.items.map((request) => (
                  <tr key={request.id}>
                    <td className="row-title">{CHANGE_REQUEST_TYPE_LABELS[request.type]}</td>
                    <td><div className="stack" style={{ gap: 1 }}>
                      <span>{shortDate(request.proposal.date)}</span>
                      {request.proposal.type === 'modify_date' ? <span className="tiny muted tabular">{timeRange(request.proposal.startMinute, request.proposal.endMinute)}</span> : null}
                    </div></td>
                    <td>{request.requesterName}</td>
                    <td className="small muted" style={{ maxWidth: 260 }}><span className="truncate-2">{request.reason}</span></td>
                    <td className="small muted">{formatIsoDateTime(request.createdAt)}</td>
                    <td><StatusBadge status={request.status} /></td>
                    <td><div className="row" style={{ justifyContent: 'flex-end' }}><Button size="sm" variant="ghost" onClick={() => onSelect(request.id)}>Ver detalle</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-pad"><Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onPage={onPage} /></div>
        </>
      )}
    </section>
  );
}
