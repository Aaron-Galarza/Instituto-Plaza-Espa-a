import { type ChangeRequest } from '@plaza/shared';
import { shortDate, timeRange } from '@/lib/format';

export interface ProposalSegmentView {
  key: string;
  serviceName: string;
  professionals: string;
  spaceName: string | null;
  groupName: string | null;
  time: string;
  modality: string;
}

interface Props {
  request: ChangeRequest;
  segments: ProposalSegmentView[];
  professionalName: (id: string) => string;
  spaceName: (id: string | null | undefined) => string | null;
}

export function RequestProposal({ request, segments, professionalName, spaceName }: Props) {
  return (
            <section>
              <h3 className="section-title">Propuesta</h3>
              {request.proposal.type === 'cancel_date' ? (
                <p className="small" style={{ margin: 0 }}>
                  Cancelar la jornada del {request.proposal.date ? shortDate(request.proposal.date) : 'día indicado'}.
                  La recurrencia semanal continúa vigente.
                </p>
              ) : request.proposal.type === 'modify_date' ? (
                <div className="stack gap-8">
                  <p className="small" style={{ margin: 0 }}>
                    Reprogramar la jornada al horario{' '}
                    <strong className="tabular">
                      {timeRange(request.proposal.startMinute, request.proposal.endMinute)}
                    </strong>
                    .
                  </p>
                  {segments.map((segment) => (
                    <div className="segment" key={segment.key}>
                      <div className="segment-head">
                        <strong>{segment.serviceName}</strong>
                        <span className="tiny tabular muted">{segment.time}</span>
                      </div>
                      <div className="tiny muted">
                        {segment.professionals}
                        {segment.spaceName ? ` · ${segment.spaceName}` : ''}
                        {segment.groupName ? ` · ${segment.groupName}` : ''}
                        {` · ${segment.modality}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : request.proposal.type === 'reassign_professional' ? (
                <div className="stack gap-8">
                  <p className="small" style={{ margin: 0 }}>
                    Reasignar el tramo a{' '}
                    <strong>{professionalName(request.proposal.professionalId)}</strong>.
                  </p>
                  {segments.map((segment) => (
                    <div className="segment" key={segment.key}>
                      <div className="segment-head">
                        <strong>{segment.serviceName}</strong>
                        <span className="tiny tabular muted">{segment.time}</span>
                      </div>
                      <div className="tiny muted">{segment.professionals}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stack gap-8">
                  <p className="small" style={{ margin: 0 }}>
                    Cambiar el espacio del tramo a{' '}
                    <strong>
                      {request.proposal.spaceId
                        ? spaceName(request.proposal.spaceId)
                        : 'sin espacio asignado'}
                    </strong>
                    .
                  </p>
                  {segments.map((segment) => (
                    <div className="segment" key={segment.key}>
                      <div className="segment-head">
                        <strong>{segment.serviceName}</strong>
                        <span className="tiny tabular muted">{segment.time}</span>
                      </div>
                      <div className="tiny muted">
                        {segment.professionals}
                        {segment.groupName ? ` · ${segment.groupName}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
  );
}
