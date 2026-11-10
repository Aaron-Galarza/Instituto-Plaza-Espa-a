'use client';

import type { Professional } from '@plaza/shared';
import { Drawer, ErrorBox, LoadingBlock, StatusBadge } from '@/components/ui';
import { errorMessage } from '@/lib/api';

export function ProfessionalDetail({ open, onClose, detail }: {
  open: boolean; onClose: () => void;
  detail: { data?: Professional; isLoading: boolean; isError: boolean; error: Error | null };
}) {
  return (
      <Drawer
        open={open}
        onClose={onClose}
        title={detail.data ? `${detail.data.firstName} ${detail.data.lastName}` : 'Profesional'}
      >
        {detail.isLoading ? <LoadingBlock rows={3} /> : null}
        {detail.isError ? <ErrorBox message={errorMessage(detail.error)} /> : null}
        {detail.data ? (
          <div className="stack gap-16">
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Especialidades</dt>
                <dd>{detail.data.specialties.join(', ')}</dd>
              </div>
              <div className="detail-row">
                <dt>Teléfono</dt>
                <dd>{detail.data.phone || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Correo</dt>
                <dd>{detail.data.email || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Estado</dt>
                <dd>
                  <StatusBadge status={detail.data.status} />
                </dd>
              </div>
            </dl>
            <a
              className="btn btn-primary btn-sm"
              href={`/agenda?professionalId=${detail.data.id}&view=week`}
            >
              Ver agenda profesional
            </a>
          </div>
        ) : null}
      </Drawer>
  );
}
