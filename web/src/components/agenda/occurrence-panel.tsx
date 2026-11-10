'use client';

import { useEffect, useState } from 'react';
import {
  type ScheduleOccurrence,
} from '@plaza/shared';
import { Button, ConfirmDialog, Drawer, ErrorBox } from '@/components/ui';
import { ClipboardIcon } from '@/components/icons';
import { errorMessage } from '@/lib/api';
import { dateLabel, timeRange } from '@/lib/format';
import { useReferenceData } from '@/lib/queries';
import { GroupBlockModal } from './group-block-modal';
import { FinishRuleModal, CancelRuleModal } from './rule-status-modals';
import { EditRuleModal } from './edit-rule-modal';
import { RequestChangeModal } from './request-change-modal';
import { OccurrenceOverview } from './occurrence-overview';
import { OccurrenceSegments } from './occurrence-segments';
import { OccurrenceHistory } from './occurrence-history';
import { OccurrenceActions } from './occurrence-actions';
import { useOccurrenceDetails } from './use-occurrence-details';
import { useOccurrenceActions } from './use-occurrence-actions';
import type { PanelMode } from './occurrence-types';
import type { JourneyReference } from './journey-builder';

export function OccurrencePanel({
  occurrence,
  onClose,
  canWrite,
  canSubmitRequest,
  reference,
}: {
  occurrence: ScheduleOccurrence | null;
  onClose: () => void;
  canWrite: boolean;
  canSubmitRequest: boolean;
  reference: JourneyReference;
}) {
  const [mode, setMode] = useState<PanelMode>(null);
  const [groupSegmentId, setGroupSegmentId] = useState<string | null>(null);
  const referenceData = useReferenceData();
  useEffect(() => {
    setMode(null);
  }, [occurrence?.key]);

  const { detail, patientWeek, patientAudit } = useOccurrenceDetails(occurrence, canWrite);

  const { invalidate, finish, cancel, remove } = useOccurrenceActions(occurrence, onClose, setMode);

  if (!occurrence) return null;

  const rule = detail.data?.rule;
  const patient = referenceData.data?.patients.find((item) => item.id === occurrence.patientId);
  const insurer = referenceData.data?.insurers.find((item) => item.id === patient?.insurerId);

  return (
    <>
      <Drawer
        open={Boolean(occurrence)}
        onClose={onClose}
        title={occurrence.patientName}
        description={`${dateLabel(occurrence.date)} · ${timeRange(occurrence.startMinute, occurrence.endMinute)}`}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            {canSubmitRequest ? (
              <Button variant="primary" onClick={() => setMode('request')}>
                <ClipboardIcon /> Solicitar cambio
              </Button>
            ) : null}
          </>
        }
      >
        <div className="stack gap-16">
          <OccurrenceOverview occurrence={occurrence} rule={rule} patient={patient} insurer={insurer} />

          <OccurrenceSegments occurrence={occurrence} canWrite={canWrite}
            onGroupBlock={(segmentId) => { setGroupSegmentId(segmentId); setMode('group-block'); }} />

          <OccurrenceHistory patientWeek={patientWeek} patientAudit={patientAudit}
            detail={detail} canWrite={canWrite} />

          <OccurrenceActions canWrite={canWrite} rule={rule} onMode={setMode} />
        </div>
      </Drawer>

      {mode === 'request' ? (
        <RequestChangeModal
          open
          occurrence={occurrence}
          reference={reference}
          onClose={() => setMode(null)}
          onCreated={() => {
            invalidate();
            setMode(null);
          }}
        />
      ) : null}

      {mode === 'edit-date' || mode === 'edit-weekday' || mode === 'edit-future' ? (
        <EditRuleModal
          open
          mode={mode === 'edit-date' ? 'date' : mode === 'edit-weekday' ? 'weekday' : 'future'}
          occurrence={occurrence}
          rule={rule ?? null}
          reference={reference}
          onClose={() => setMode(null)}
          onSaved={() => {
            invalidate();
            setMode(null);
            onClose();
          }}
        />
      ) : null}

      {mode === 'group-block' && groupSegmentId ? (
        <GroupBlockModal
          occurrence={occurrence}
          segmentId={groupSegmentId}
          reference={reference}
          onClose={() => setMode(null)}
          onSaved={() => {
            invalidate();
            setMode(null);
            onClose();
          }}
        />
      ) : null}

      {mode === 'finish' && rule ? (
        <FinishRuleModal
          open
          rule={rule}
          occurrence={occurrence}
          busy={finish.isPending}
          error={finish.isError ? errorMessage(finish.error) : undefined}
          onClose={() => setMode(null)}
          onSubmit={(values) => finish.mutate(values)}
        />
      ) : null}

      {mode === 'cancel' ? (
        <CancelRuleModal
          open
          busy={cancel.isPending}
          error={cancel.isError ? errorMessage(cancel.error) : undefined}
          onClose={() => setMode(null)}
          onSubmit={(reason) => cancel.mutate({ reason })}
        />
      ) : null}

      <ConfirmDialog
        open={mode === 'delete'}
        title="Eliminar jornada"
        description="Se eliminarán la recurrencia, sus excepciones y sus afectaciones pendientes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onCancel={() => setMode(null)}
        onConfirm={() => remove.mutate()}
      />
      {remove.isError ? <ErrorBox message={errorMessage(remove.error)} /> : null}
    </>
  );
}
