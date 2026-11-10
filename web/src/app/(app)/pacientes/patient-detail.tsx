'use client';

import { TRANSPORT_MODE_LABELS, type Patient } from '@plaza/shared';
import { Drawer, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { errorMessage } from '@/lib/api';

export function PatientDetail({ open, onClose, detail, canWrite, insurerName }: {
  open: boolean; onClose: () => void; canWrite: boolean;
  detail: { data?: Patient; isLoading: boolean; isError: boolean; error: Error | null };
  insurerName: (id: string | null | undefined) => string;
}) {
  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={detail.data ? `${detail.data.firstName} ${detail.data.lastName}` : 'Paciente'}
      >
        {detail.isLoading ? <LoadingBlock rows={3} /> : null}
        {detail.isError ? <ErrorBox message={errorMessage(detail.error)} /> : null}
        {detail.data ? (
          <div className="stack gap-16">
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Documento</dt>
                <dd>{detail.data.document || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Obra social</dt>
                <dd>{insurerName(detail.data.insurerId)}</dd>
              </div>
              <div className="detail-row">
                <dt>Afiliado</dt>
                <dd>{detail.data.affiliateNumber || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Teléfono</dt>
                <dd>{detail.data.phone || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Traslado</dt>
                <dd>{TRANSPORT_MODE_LABELS[detail.data.transportMode]}</dd>
              </div>
              <div className="detail-row">
                <dt>Estado</dt>
                <dd>
                  <StatusBadge status={detail.data.status} />
                </dd>
              </div>
            </dl>
            {canWrite && detail.data.adminNotes ? (
              <p className="small">{detail.data.adminNotes}</p>
            ) : null}
            <a
              className="btn btn-primary btn-sm"
              href={`/agenda?patientId=${detail.data.id}&view=week`}
            >
              Ver agenda del paciente
            </a>
          </div>
        ) : null}
      </Drawer>
  );
}
