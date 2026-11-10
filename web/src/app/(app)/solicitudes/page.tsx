'use client';

import { useState } from 'react';
import { CHANGE_REQUEST_TYPE_LABELS, type ChangeRequest } from '@plaza/shared';
import { ConfirmDialog, ErrorBox, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useReferenceData } from '@/lib/queries';
import { errorMessage } from '@/lib/api';
import { conflictsFromError } from '@/lib/conflicts';
import { shortDate } from '@/lib/format';
import { AdjustRequestModal } from './adjust-request-modal';
import { RequestControls, type StatusTab } from './request-controls';
import { RequestsList } from './requests-list';
import { RequestDetailDrawer } from './request-detail-drawer';
import { RequestResolutionModal } from './request-resolution-modal';
import { useRequestProposal } from './use-request-proposal';
import { useRequestData } from './use-request-data';
import { useRequestActions, type ResolutionMode } from './use-request-actions';

export default function ChangeRequestsPage() {
  const { user, can } = useAuth();
  const reference = useReferenceData();
  const canRead = can('requests:read');
  const canResolve = can('requests:resolve');

  const [status, setStatus] = useState<StatusTab>('pending');
  const [type, setType] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [resolutionConflicts, setResolutionConflicts] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState<ChangeRequest | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const { requests, pendingCount, selectedSummary, detail, current, rule } = useRequestData({
    page, status, type, mineOnly, selectedId, canRead, canScheduleRead: can('schedule:read'),
  });

  const { proposalSegments, professionalName, spaceName } = useRequestProposal(current, rule.data, reference.data);

  const { resolve, cancel, invalidateAfterResolution, queryClient, notify } = useRequestActions({
    onResolved: () => {
      setResolutionMode(null);
      setResolutionNote('');
      setResolutionError(null);
      setResolutionConflicts([]);
    },
    onResolveError: (error) => {
      setResolutionError(errorMessage(error));
      setResolutionConflicts(conflictsFromError(error).map((item) => item.message));
    },
    onCancelled: () => setCancelling(null),
  });

  const openResolution = (mode: ResolutionMode) => {
    setResolutionMode(mode);
    setResolutionNote('');
    setResolutionError(null);
    setResolutionConflicts([]);
  };

  const submitResolution = () => {
    if (!current) return;
    if (resolutionNote.trim().length < 3) {
      setResolutionError('Indicá una nota de resolución de al menos 3 caracteres.');
      return;
    }
    if (!resolutionMode) return;
    setResolutionError(null);
    resolve.mutate({
      request: current,
      mode: resolutionMode,
      note: resolutionNote.trim(),
    });
  };

  const canCancelCurrent =
    Boolean(current) &&
    current?.status === 'pending' &&
    (current?.requesterId === user?.id || canResolve);

  if (!canRead) {
    return (
      <>
        <PageHeader eyebrow="Planificación" title="Solicitudes" />
        <ErrorBox message="No tenés permiso para consultar solicitudes de cambio." />
      </>
    );
  }

  return (
    <>
      <RequestControls
        status={status} type={type} mineOnly={mineOnly} canResolve={canResolve}
        isProfessional={user?.role === 'professional'} pendingCount={pendingCount.data?.total ?? 0}
        onStatus={(value) => { setStatus(value); setPage(1); }}
        onType={(value) => { setType(value); setPage(1); }}
        onMineOnly={(value) => { setMineOnly(value); setPage(1); }}
        onReset={() => { setStatus('pending'); setType(''); setMineOnly(false); setPage(1); }}
      />
      <RequestsList status={status} data={requests.data} isLoading={requests.isLoading}
        error={requests.error} onSelect={setSelectedId} onPage={setPage} />

      <RequestDetailDrawer current={current} selectedSummary={selectedSummary}
        detailLoading={detail.isLoading} detailError={detail.error} rule={rule.data}
        referenceReady={Boolean(reference.data)} proposalSegments={proposalSegments}
        professionalName={professionalName} spaceName={spaceName}
        canCancelCurrent={canCancelCurrent} canResolve={canResolve} cancelPending={cancel.isPending}
        onClose={() => setSelectedId(null)} onCancel={setCancelling}
        onAdjust={() => setAdjusting(true)} onResolve={openResolution} />

      {adjusting && current && rule.data && reference.data ? (
        <AdjustRequestModal
          key={`${current.id}-${current.version}`}
          request={current}
          rule={rule.data}
          reference={{
            patients: reference.data.patients,
            professionals: reference.data.professionals,
            services: reference.data.services,
            spaces: reference.data.spaces,
            groups: reference.data.groups,
          }}
          onClose={() => setAdjusting(false)}
          onSaved={(updated) => {
            queryClient.setQueryData(['change-request', updated.id], updated);
            invalidateAfterResolution();
            notify('Propuesta ajustada. La solicitud continúa pendiente.');
            setAdjusting(false);
          }}
        />
      ) : null}

      <RequestResolutionModal mode={resolutionMode} current={current} note={resolutionNote}
        error={resolutionError} conflicts={resolutionConflicts} busy={resolve.isPending}
        onClose={() => setResolutionMode(null)} onClearError={() => setResolutionError(null)}
        onNote={setResolutionNote} onSubmit={submitResolution} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancelar solicitud"
        description={
          cancelling
            ? `La solicitud de ${CHANGE_REQUEST_TYPE_LABELS[cancelling.type].toLowerCase()} del ${shortDate(
                cancelling.proposal.date,
              )} quedará cancelada. La agenda no se modifica.`
            : ''
        }
        confirmLabel="Cancelar solicitud"
        busy={cancel.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) cancel.mutate(cancelling);
        }}
      />
    </>
  );
}
