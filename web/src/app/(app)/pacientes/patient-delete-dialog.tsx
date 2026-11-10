'use client';

import type { Patient } from '@plaza/shared';
import { ConfirmDialog } from '@/components/ui';

export function PatientDeleteDialog({ patient, busy, onCancel, onConfirm }: {
  patient: Patient | null; busy: boolean; onCancel: () => void; onConfirm: (patient: Patient) => void;
}) {
  return (
      <ConfirmDialog
        open={Boolean(patient)}
        title="Eliminar paciente"
        description={
          patient
            ? `Se intentará eliminar a ${patient.firstName} ${patient.lastName}. Si tiene jornadas o referencias asociadas, el sistema lo impedirá.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={busy}
        onCancel={onCancel}
        onConfirm={() => {
          if (patient) onConfirm(patient);
        }}
      />
  );
}
