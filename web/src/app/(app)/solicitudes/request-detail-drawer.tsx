import { CHANGE_REQUEST_TYPE_LABELS, WEEKDAY_SHORT_LABELS, formatIsoDateTime, formatLongDate, type ChangeRequest, type ScheduleRuleDetail } from '@plaza/shared';
import { Badge, Button, Drawer, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { CheckIcon, XIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { shortDate, timeRange } from '@/lib/format';
import { RequestProposal, type ProposalSegmentView } from './request-proposal';

interface Props {
  current: ChangeRequest | null;
  selectedSummary: ChangeRequest | null;
  detailLoading: boolean;
  detailError: Error | null;
  rule?: ScheduleRuleDetail;
  referenceReady: boolean;
  proposalSegments: ProposalSegmentView[];
  professionalName: (id: string) => string;
  spaceName: (id: string | null | undefined) => string | null;
  canCancelCurrent: boolean;
  canResolve: boolean;
  cancelPending: boolean;
  onClose: () => void;
  onCancel: (request: ChangeRequest) => void;
  onAdjust: () => void;
  onResolve: (mode: 'approve' | 'reject') => void;
}

export function RequestDetailDrawer({ current, selectedSummary, detailLoading, detailError,
  rule, referenceReady, proposalSegments, professionalName, spaceName, canCancelCurrent,
  canResolve, cancelPending, onClose, onCancel, onAdjust, onResolve }: Props) {
  const proposalDate = current?.proposal.date ?? null;
  return (
      <Drawer
        open={Boolean(current)}
        onClose={() => onClose()}
        title={current ? CHANGE_REQUEST_TYPE_LABELS[current.type] : 'Solicitud'}
        description={
          current ? `${current.requesterName} · ${formatIsoDateTime(current.createdAt)}` : undefined
        }
        footer={
          current ? (
            <>
              <Button variant="ghost" onClick={() => onClose()}>
                Cerrar
              </Button>
              {canCancelCurrent ? (
                <Button
                  variant="secondary"
                  onClick={() => onCancel(current)}
                  disabled={cancelPending}
                >
                  <XIcon /> Cancelar solicitud
                </Button>
              ) : null}
              {canResolve && current.status === 'pending' ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => onAdjust()}
                    disabled={!rule || !referenceReady}
                  >
                    Ajustar propuesta
                  </Button>
                  <Button variant="secondary" onClick={() => onResolve('reject')}>
                    Rechazar
                  </Button>
                  <Button variant="primary" onClick={() => onResolve('approve')}>
                    <CheckIcon /> Aprobar
                  </Button>
                </>
              ) : null}
            </>
          ) : null
        }
      >
        {detailLoading && !selectedSummary ? (
          <LoadingBlock rows={6} />
        ) : Boolean(detailError) && !selectedSummary ? (
          <ErrorBox message={errorMessage(detailError)} />
        ) : current ? (
          <div className="stack gap-16">
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              <StatusBadge status={current.status} />
              <Badge tone="mist">Versión {current.version}</Badge>
              {current.type === 'cancel_date' ? <Badge tone="ink">Cancelación</Badge> : null}
            </div>

            <dl className="detail-list">
              <div className="detail-row">
                <dt>Solicitante</dt>
                <dd>{current.requesterName}</dd>
              </div>
              <div className="detail-row">
                <dt>Fecha</dt>
                <dd>
                  {proposalDate ? formatLongDate(proposalDate) : '—'}
                  {proposalDate ? (
                    <span className="tiny muted" style={{ display: 'block' }}>
                      {shortDate(proposalDate)}
                    </span>
                  ) : null}
                </dd>
              </div>
              {rule ? (
                <>
                  <div className="detail-row">
                    <dt>Paciente</dt>
                    <dd>{rule.patientName}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Recurrencia</dt>
                    <dd>
                      {rule.rule.daysOfWeek
                        .map((day) => WEEKDAY_SHORT_LABELS[day])
                        .join(' · ')}{' '}
                      · {timeRange(rule.rule.startMinute, rule.rule.endMinute)}
                    </dd>
                  </div>
                </>
              ) : null}
              <div className="detail-row">
                <dt>Creada</dt>
                <dd>{formatIsoDateTime(current.createdAt)}</dd>
              </div>
            </dl>

            <RequestProposal request={current} segments={proposalSegments}
              professionalName={professionalName} spaceName={spaceName} />

            <section>
              <h3 className="section-title">Motivo</h3>
              <p className="small" style={{ margin: 0 }}>
                {current.reason}
              </p>
            </section>

            {current.status !== 'pending' ? (
              <section>
                <h3 className="section-title">Resolución</h3>
                <dl className="detail-list">
                  <div className="detail-row">
                    <dt>Nota</dt>
                    <dd>{current.resolutionNote || '—'}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Resuelta por</dt>
                    <dd>{current.resolvedByName || '—'}</dd>
                  </div>
                  <div className="detail-row">
                    <dt>Fecha</dt>
                    <dd>{current.resolvedAt ? formatIsoDateTime(current.resolvedAt) : '—'}</dd>
                  </div>
                </dl>
              </section>
            ) : null}

            <p className="tiny muted" style={{ margin: 0 }}>
              Identificador de la jornada: <span className="tabular">{current.resourceId}</span>
            </p>
          </div>
        ) : null}
      </Drawer>
  );
}
